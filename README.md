# Animate CSS, step-by-step, with JavaScript

This plugin allows you to manually animate elements using a mix of CSS and JavaScript. Define your start and end styling, set the percentage you want to animate to (any valid floating-point number between 0 and 1) and this takes care of the rest. You can programmatically step through the animation to any point (as a percentage) that you want. 

## Why did I make this?

CSS animations and transitions are perfectly functional, but I wanted to be able to handle animation playback manually. Namely I wanted to animate page elements based on the browser's scroll position with somewhat fine-grained control. I made this plugin to help facilitate this.

## Usage

Include `animate-css.js` on your page:
```
<script type="text/javascript" src="src/animate-css.js">
```

Next, add the `data-styling-start=""` and `data-styling-end=""` attributes to any elements that you'd like to animate, and enter the starting and ending CSS properties you'd like to animate between:
```
<div class="thing-to-animate" id="thing" 
    data-styling-start="top: 0px; transform: rotate(0deg);" 
    data-styling-start="top: 100px; transform: rotate(180deg);"></div>
```

Now create an instance of `AnimateCSS`:
```
<script type="text/javascript">
    var thing = new AnimateCSS(document.getElementById('thing'));
</script>
```

Once that's done, you can set the animation position as a percentage: 
```
<script type="text/javascript">
    thing.animateTo(.5);
</script>
```
This will interpolate numerical CSS property values between your defined start and end stylings, and update the element's `style` attribute accordingly.

In this example, setting `thing.animateTo(.5);` would result in calculated CSS of `style="top: 50px; transform: rotate(90deg);"`. Setting `thing.animateTo(.33);` would result in `style="top: 33px; transform: rotate(59.4deg);"`. And so on.

## License
[MIT](https://choosealicense.com/licenses/mit/)