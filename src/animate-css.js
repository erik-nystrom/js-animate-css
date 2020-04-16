class AnimateCSS {

    constructor(element, percentage) {
        
        this.element = element;
        this.percentage = (typeof percentage != 'undefined' ? percentage : 0);
        this.styles = {
            'start': {},
            'end': {},
        };
        this.ranges = {};
        this.transformProperties = ['transform', 'webkitTransform', 'WebkitTransform', '-webkit-transform', 'MozTransform', '-moz-transform'];

        var toAnimate = {};
        var doc = new Document();

        for(const i in element.dataset) {

            var style = document.createElement('style');
            style.textContent = `div {${element.dataset[i]}}`;
            doc.append(style);

            var key = (i == 'stylingStart' ? 'start' : 'end');
            var ignore = ['cssText', 'length', 'parentRule', 'item', 'getPropertyValue', 'getPropertyPriority', 'setProperty', 'removeProperty'];
            console.log(style.sheet);
            for (const i in style.sheet.cssRules[0].style) {
                if(parseInt(i) == i || ignore.indexOf(i) > -1 || style.sheet.cssRules[0].style[i] == '') {
                    continue;
                }
                this.styles[key][i] = style.sheet.cssRules[0].style[i];
            }

            doc.removeChild(style);

        }

        // figure out what rules to ignore if they aren't present in *both* the start and end styling lists
        let startKeys = Object.keys(this.styles.start);
        let endKeys = Object.keys(this.styles.end);

        for(let i = 0; i < startKeys.length; i++) {
            if(endKeys.indexOf(startKeys[i]) > -1) {
                toAnimate[startKeys[i]] = true;
            }
        }

        for(const i in toAnimate) {

            if(this.transformProperties.indexOf(i) > -1) {

                // it's a messy way to parse the transform attributes, but it works well enough
                let raw = {
                    'start': this.styles.start[i].split(')').filter(function(e){return e != '';}),
                    'end': this.styles.end[i].split(')').filter(function(e){return e != '';})
                }

                let transforms = {
                    'start': {},
                    'end': {}
                }

                for(const j in raw) {
                    raw[j].forEach(function(item, index){
                        item = item.replace('(', ':').trim().split(':');
                        if(item[1].indexOf(',') > -1) {
                            item[1] = item[1].split(',').map(i => i.trim());
                        }
                        /**
                         * some browsers report translate(0px, 0px) as translate(0px), or translate3d(0px, 0px, 0px) as translate3d(0px)
                         * this will force the parameter count to be consistent
                         */
                        if(item[0] == 'translate' && typeof item[1] != 'object') {
                            item[1] = [item[1], item[1]];
                        } else if(item[0] == 'translate3d' && typeof item[1] != 'object') {
                            item[1] = [item[1], item[1], item[1]];
                        }

                        transforms[j][item[0]] = item[1];
                        
                    });
                }

                let startKeys = Object.keys(transforms.start);
                let endKeys = Object.keys(transforms.end);
                let toTransform = {};

                for(let i = 0; i < startKeys.length; i++) {
                    if(endKeys.indexOf(startKeys[i]) > -1) {
                        toTransform[startKeys[i]] = true;
                    }
                }

                var ranges = {};

                for(const i in toTransform) {
                    if(typeof transforms.start[i] == 'object') {
                        ranges[i] = {};
                        for(const j in transforms.start[i]) {
                            var transformRangesArray = this.parseRange(transforms.start[i][j], transforms.end[i][j]);
                            ranges[i][j] = transformRangesArray;
                        }
                    } else {
                        var transformRanges = this.parseRange(transforms.start[i], transforms.end[i]);
                        ranges[i] = transformRanges;
                    }
                }

            } else {
                var ranges = this.parseRange(this.styles.start[i], this.styles.end[i]);
            }

            this.ranges[i] = ranges;
        }
                
        this.animateTo(this.percentage);
        
    }

    parseColor(value) {

        value = value
            .replace('rgb(', '')
            .replace('rgba(', '')
            .replace(')', '')
            .split(',');
        
            // force all colors to rgba-format for simplicity's sake
            if(value.length == 3) {
                value.push('1')
            };

            value.filter(function(v){
                return parseFloat(v.trim()).toString();
            });

        for(const v in value) {
            value[v] = parseFloat(value[v]);
        }
        
        return value;
        
    };

    parseDegrees(value) {

        value = value
            .replace('rotate(', '')
            .replace('deg', '')
            .replace(')', '');
        
        value = parseFloat(value);

        return value;

    }

    parseRange(start, end) {

        var units = '';
        var multiplier = 1;

        if(start.indexOf('%') >= 0) {
            units = '%';
        } else if(start.indexOf('deg') >= 0) {
            units = 'deg';
        } else if(start.indexOf('px') >= 0) {
            units = 'px';
        } else if(start.indexOf('rgb') >= 0 || start.indexOf('rgba') >= 0) {
            units = 'color';
        } else {
            units = '';
        }

        if(units == 'color') {

            start = this.parseColor(start);
            end = this.parseColor(end);
            range = [];
            multiplier = [1,1,1,1];
            
            for(const j in start) {
                if(start[j] > end[j]) {
                    multiplier[j] = -1;
                }
                range.push(Math.abs(Math.max(start[j], end[j]) - Math.min(start[j], end[j])));
            }

        }else if (units == 'deg') {
            
            start = this.parseDegrees(start);
            end = this.parseDegrees(end);
            if(start > end) {
                multiplier = -1;
            }
            var range = Math.abs(Math.max(start, end) - Math.min(start, end));

        } else {

            start = parseFloat(start);
            end = parseFloat(end);

            if(start > end) {
                multiplier = -1;
            }
            var range = Math.abs(Math.max(start, end) - Math.min(start, end));

        }

        var calculated = {
            'units': units,
            'start': start,
            'end': end,
            'range': range,
            'multiplier': multiplier
        };

        return calculated;

    }

    calculateAnimateTo(range, percentage) {

        let styles = '';

        if(range.units == 'color') {

            let calculated = [];

            for(const j in range.start) {
                calculated[j] = range.start[j] + (range.range[j] * range.multiplier[j] * percentage);
            }

            // floating point values are invalid for RGB/RBGA colors, so they must be integerized
            // ONLY DO THE FIRST 3, AS INTEGERIZING THE OPACITY WILL RUIN IT
            for(let c = 0; c <=2; c++) {
                calculated[c] = parseInt(calculated[c]);
            }

            if(calculated.length == 4) {
                calculated = 'rgba(' + calculated.join(',') + ')';
            } else {
                calculated = 'rgb(' + calculated.join(',') + ')';
            }

            styles = calculated;
            
        } else {

            styles = range.start + (range.range * range.multiplier * percentage);
            styles = `${styles}${range.units}`;

        }

        return styles;

    }

    animateTo(percentage) {

        var styles = {};

        for(const i in this.ranges) {
            
            if(this.transformProperties.indexOf(i) > -1) {

                styles[i] = [];
                
                for(const j in this.ranges[i]) {
                    var translates = ['translate', 'translate3d'];
                    if(translates.indexOf(j) > -1 && typeof this.ranges[i][j] == 'object') {
                        var translate = [];
                        for(const k in this.ranges[i][j]) {
                            translate.push(this.calculateAnimateTo(this.ranges[i][j][k], percentage))
                        }
                        translate = translate.join(', ');
                        styles[i].push(`${j}(${translate})`);
                    } else {
                        styles[i].push(`${j}(${this.calculateAnimateTo(this.ranges[i][j], percentage)})`);
                    }
                }

                styles[i] = styles[i].join(' ');

            } else {
                styles[i] = this.calculateAnimateTo(this.ranges[i], percentage);
            }

        }

        for(const i in styles) {
            this.element.style[i] = styles[i];
        }

    }
    
}