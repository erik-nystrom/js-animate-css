class AnimateCSS {

    element = null;
    styles = null;
    ranges = null;
    percentage = 0;
    
    constructor(element, percentage) {
        
        this.element = element;

        if(typeof percentage != 'undefined') {
            this.percentage = percentage;
        }

        this.styles = {
            '_start': {},
            '_end': {},
        };

        this.ranges = {};

        var toAnimate = {};

        // create style elements in the dom so that parsing the actual CSS rules is simpler
        var start = element.dataset.startingStyles.split(';');
        for(const i in start) {
            if(start[i] == '') {
                continue;
            }
            let split = start[i].split(':');
            this.styles._start[split[0].trim()] = split[1].trim();
        }
       
        var end = element.dataset.endingStyles.split(';');
        for(const i in end) {
            if(start[i] == '') {
                continue;
            }
            let split = end[i].split(':');
            this.styles._end[split[0].trim()] = split[1].trim();
        }

        // figure out what rules to ignore if they aren't present in *both* the start and end styling lists

        for(const i in this.styles._start) {
            toAnimate[i] = false;
            for(const j in this.styles._end) {
                if(i == j) {
                    toAnimate[i] = true;
                }
            }
        }

        for(const i in toAnimate) {
            if(toAnimate[i] == false) {
                delete this.styles._start[i];
                delete this.styles._end[i];
            }
        }
        
        for(const i in this.styles._start) {
            var ranges = this.parseRange(this.styles._start[i], this.styles._end[i]);
            this.ranges[i] = ranges;
        }

        this.animateTo(this.percentage);
        
    }

    parseColor(value) {

        value = value
            .replace('rgb(', '')
            .replace('rgba(', '')
            .replace(')', '')
            .split(',')
            .filter(function(v){
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

            if(units == '') {
                console.log(start, end);
            }

            start = parseFloat(start);
            end = parseFloat(end);

            if(units == '') {
                console.log(start, end);
            }

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

    animateTo(percentage) {

        console.log(percentage);
        console.log(this.ranges);

        var styles = {};

        for(const i in this.ranges) {
            
            if(this.ranges[i].units == 'color') {

                let calculated = [];

                for(const j in this.ranges[i].start) {
                    calculated[j] = this.ranges[i].start[j] + (this.ranges[i].range[j] * this.ranges[i].multiplier[j] * percentage);
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

                styles[i] = calculated;
                
            } else if(this.ranges[i].units == 'deg') {

                styles[i] = this.ranges[i].start + (this.ranges[i].range * this.ranges[i].multiplier * percentage);
                styles[i] = `rotate(${styles[i]}deg)`;

            } else {

                styles[i] = this.ranges[i].start + (this.ranges[i].range * this.ranges[i].multiplier * percentage);
                styles[i] = `${styles[i]}${this.ranges[i].units}`;

            }

        }

        var css = '';
        for(const i in styles) {
            css += `${i}: ${styles[i]}; `;
        }

        this.element.setAttribute('style', css);

    }
    
}