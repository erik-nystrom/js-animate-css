function AnimateWithScroll(element) {

    var scr = this;

    this.element = $(element);
    this.config = {
        'forcerepaint': false,
        'debug': this.element.data('animateDebug'),
        'triggers': {
            'start': 0,
            'end': 0,
            'element': this.element.data('animateTriggerElement') ? $(this.element.data('animateTriggerElement')) : this.element.parent()
        },
        'styling': {
            '_calculated': {
            },
            'start': this.element.data('animateStartStyling'),
            'end': this.element.data('animateEndStyling')
        }
    };

    if(scr.element.find('.force-repaint').length) {
        scr.config.forcerepaint = scr.element.find('.force-repaint').get(0);
        scr.forceRepaint = function(){
            scr.config.forcerepaint.innerHTML = '&nbsp;';
        };
    } else {
        scr.forceRepaint = function(){};
    }

    scr.parseColor = function(value) {
        value = value
            .replace('rgb(', '')
            .replace('rgba(', '')
            .replace(')', '')
            .split(',')
            .filter(function(v){
                return parseFloat(v);
            });

        for(v in value) {
            value[v] = parseFloat(value[v]);
        }
        
        return value;
        
    };

    scr.formatStyles = function(styles) {

        styles.transform = '';
        
        for(i in styles) {
            if(i.toString().indexOf('transform.') >= 0) {
                var transform = i.replace('transform.', '');
                styles.transform += (transform + '(' + styles[i] + ')');
            }
        }

        return styles;
    
    };

    scr.calculateTriggers = function() {

        var config = {
            'triggers': {
                'start': this.element.data('animateStartTrigger'),
                'end': this.element.data('animateEndTrigger')
            }
        };

        var triggerElement = scr.config.triggers.element;

        if(config.triggers.start.indexOf('%') >= 0) {
            var percentage = parseInt(config.triggers.start) / 100;
            scr.config.triggers.start = triggerElement.offset().top + (triggerElement.outerHeight() * percentage);
        } else if (config.triggers.start.indexOf('px') > 0) {
            scr.config.triggers.start = parseInt(config.triggers.start);
        }

        if(config.triggers.end.indexOf('%') >= 0) {
            var percentage = parseInt(config.triggers.end) / 100;
            scr.config.triggers.end = triggerElement.offset().top + (triggerElement.outerHeight() * percentage);
        } else if (config.triggers.end.indexOf('px') > 0) {
            scr.config.triggers.end = parseInt(config.triggers.end);
        }

        for(i in scr.config.styling.start) {

            var start = scr.config.styling.start[i].toString();
            var end = scr.config.styling.end[i].toString();
            var units = '';

            if(start.indexOf('%') >= 0) {
                units = '%';
            } else if(start.indexOf('deg') >= 0) {
                units = 'deg';
            } else if(start.indexOf('px') >= 0) {
                units = 'px';
            } else if(start.indexOf('rgb') >= 0 || start.indexOf('rgba') >= 0) {
                units = 'color';
            } 

            if(units == 'color') {

                start = scr.parseColor(start);
                end = scr.parseColor(end);
                range = [];
                
                
                for(j in start) {
                    range.push(Math.abs(Math.max(start[j], end[j]) - Math.min(start[j], end[j])));
                }

            } else {

                start = parseFloat(start);
                end = parseFloat(end);
                var range = Math.abs(Math.max(start, end) - Math.min(start, end));

            }

            scr.config.styling._calculated[i] = {
                'units': units,
                'start': start,
                'end': end,
                'range': range
            };
            
        }
        
    };

    scr.start = function(){
        scr.element.css(scr.formatStyles($.extend({}, scr.config.styling.start)));
        scr.forceRepaint();
    };
    
    scr.end = function() {
        scr.element.css(scr.formatStyles($.extend({}, scr.config.styling.end)));
        scr.forceRepaint();
    };
    
    scr.animate = function(top) {

        var percentage = (top - scr.config.triggers.start) / (scr.config.triggers.end - scr.config.triggers.start);
        var styles = {};
        var transform = {};

        for(i in scr.config.styling.start) {

            if(scr.config.styling._calculated[i].units == 'color') {

                var calculated = [];

                for(j in scr.config.styling._calculated[i].start) {
                    if(scr.config.styling._calculated[i].start[j] < scr.config.styling._calculated[i].end[j]) {
                        calculated.push(scr.config.styling._calculated[i].start[j] + (scr.config.styling._calculated[i].range[j] * percentage));
                    } else {
                        calculated.push(scr.config.styling._calculated[i].start[j] - (scr.config.styling._calculated[i].range[j] * percentage));
                    }
                }

                // floating point values are invalid for RGB/RBGA colors, so they must be integerized
                // ONLY DO THE FIRST 3, AS INTEGERIZING THE OPACITY WILL RUIN IT
                for(c = 0; c <=2; c++) {
                    calculated[c] = parseInt(calculated[c]);
                }

                if(calculated.length == 4) {
                    calculated = 'rgba(' + calculated.join(',') + ')';
                } else {
                    calculated = 'rgb(' + calculated.join(',') + ')';
                }

                styles[i] = calculated;

            } else {
                if(scr.config.styling._calculated[i].start < scr.config.styling._calculated[i].end) {
                    var calculated = scr.config.styling._calculated[i].start + (scr.config.styling._calculated[i].range * percentage);
                } else {
                    var calculated = scr.config.styling._calculated[i].start - (scr.config.styling._calculated[i].range * percentage);
                }
                styles[i] = calculated + scr.config.styling._calculated[i].units;
            }

        }
        
        scr.element.css(scr.formatStyles($.extend({}, styles)));
        scr.forceRepaint();
    }

    scr.init = function() {
        
        for(i in scr.config.styling.start) {
            if(scr.config.styling.start[i] == 'initial') {
                scr.config.styling.start[i] = scr.element.css(i);
            }
        }

        for(i in scr.config.styling.end) {
            if(scr.config.styling.end[i] == 'initial') {
                scr.config.styling.end[i] = scr.element.css(i);
            }
        }

        scr.calculateTriggers();    
        scr.element.removeAttr('style');
        scr.start();

    }
    
    scr.init();
    
    return scr;

}