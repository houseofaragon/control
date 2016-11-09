
var animationRatio = url.int('resolution', 100) / 100;
var two = new Two({
  type: (url.boolean('canvas') || (has.mobile && has.iOS) || (!has.mobile && has.Firefox)) ? Two.Types.canvas : Two.Types.svg
  // fullscreen: true
}).appendTo(document.querySelector('#content'));

two.renderer.domElement.id = 'stage';

/**
 * Collection of animations and such for Neuronal Synchrony.
 */

var TWO_PI = Math.PI * 2;

window.animations = (function() {

  var container = document.querySelector('#content');
  var domElement = two.renderer.domElement;
  var width = $(window).width(), height = $(window).height();
  var center = { x: width / 2, y: height / 2 };
  var min_dimension = width > height ? height : width;
  var duration = 1000;
  var drag = 0.125;
  var monome = {};
  var pistonAmount = 3;
  var prismAmount = 3;
  var flashAmount = 3;

  two.renderer.setSize(width, height, animationRatio);

  var Easing = TWEEN.Easing;
  var PROPERTIES = ['background', 'middleground', 'foreground', 'highlight', 'accent', 'white', 'black'];
  var PALETTE = [
    {
      // Grey
      background: { r: 181, g: 181, b: 181, a: 0.7 },
      middleground: { r: 141, g: 164, b: 170, a: 0.7  },
      foreground: { r: 227, g: 79, b: 12, a: 0.7  },
      highlight: { r: 163, g: 141, b: 116, a: 0.7  },
      accent: { r: 255, g: 197, b: 215, a: 0.7  },
      white: { r: 255, g: 255, b: 255, a: 0.7  },
      black: { r: 0, g: 0, b: 0, a: 0.7  },
      isDark: false
    }
  ];

  var current = url.int('palette', 0);
  var _colors = {};
  var colors = {};

  _.each(PALETTE[current], function(v, k) {
    _colors[k] = _.clone(v);
    colors[k] = toRGB(v);
  });

  colors.getRandomKey = function() {
    return PROPERTIES[Math.floor(Math.random() * PROPERTIES.length)];
  };

  // Two.js colors from main.css
  var gradientColors = [
    'rgb(255, 64, 64)',
    'rgb(255, 128, 0)',
    'rgb(0, 200, 255)',
    'rgb(0, 191, 168)',
    'rgb(153, 102, 255)',
    'rgb(255, 244, 95)'
  ];
  gradientColors.index = 0;

  var linearGradient = two.makeLinearGradient(
    two.width / 2, - two.height / 2,
    two.width / 2, two.height / 2,
    new Two.Stop(0, gradientColors[4],1),
    new Two.Stop(0.25, gradientColors[3], 0.5),
    new Two.Stop(0.5, gradientColors[2], 0.5),
    new Two.Stop(0.75, gradientColors[3], 0.5),
    new Two.Stop(1, gradientColors[4], 0.5)
  );

  var radialGradient = two.makeRadialGradient(
    0, 0,
    Math.max(two.width, two.height),
    new Two.Stop(0, gradientColors[3], 1),
    new Two.Stop(0.25, gradientColors[2], 0),

    new Two.Stop(0.5, gradientColors[4], 0)
  );

  domElement.style.background = linearGradient;


/** [0,1], [1,1], [1,2] **/
  var wipe = (function() {

    var callback = _.identity;
    var playing = false;

    var amount = 8,
        w = width * Math.random(),
        h = height * Math.random();

    var distance = height/2,
        rotation = Math.PI / 2;

    var destinations = [];
    var points = _.map(_.range(amount), function(i) {
      var pct = i / amount;
      console.log('pct: ', pct)
      var theta = TWO_PI * pct;
      var x = distance * Math.sin(theta);
      var y = distance * Math.cos(theta);
      destinations.push(new Two.Vector(x, y));
      return new Two.Anchor(x, y);
    });
    console.log(points)
    var wipe = two.makeCurve(points, false);
    wipe.fill = linearGradient;
    //wipe.noStroke();

    points = wipe.vertices;
    console.log('destinations: ', destinations)
    var start = function(onComplete, silent) {
      wipe.visible = true;
      _in.start();
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var update = function() {
      wipe.fill = linearGradient;
    };

    var resize = function() {};

    var options = { ending: 0 };

    var v, i, l, d, x, y, a, theta, ptheta;

    var _in = new TWEEN.Tween(options)
      .to({ ending: 1 }, duration * 0.75)
      .easing(Easing.Circular.In)
      .onStart(function() {
        playing = true;
      })
      .onUpdate(function() {
        console.log('Options.ending: ', options.ending)
        var t = options.ending;
        for (i = 0; i < amount; i++) {
          v = points[i];
          d = destinations[i];
          x = lerp(v.x, d.x, t);
          y = lerp(v.y, d.y, t);
          v.set(x, y);
          console.log('Options.ending: ', options.ending)

        }
      })
      .onComplete(function() {
        start.onComplete();
        callback();
      });

    function reset() {

      wipe.visible = false;
      impact = new Two.Vector(Math.random() * width, Math.random() * height);
      var x, y, pos = Math.random() * 8;



      wipe.translation.set(x, y);
      options.ending = 0;
      distance = height;

      for (i = 0; i < amount; i++) {
        v = points[i];
        pct = i / amount;
        ptheta = pct * TWO_PI;
        v.set(distance * Math.cos(ptheta), distance * Math.sin(ptheta));
        theta = angleBetween(v, impact) - ptheta;
        d = v.distanceTo(impact);
        a = 10 * distance / Math.sqrt(d);
        x = a * Math.cos(theta) + v.x;
        y = a * Math.sin(theta) + v.y;
        destinations[i].set(x, y);
      }

      playing = false;
      _in.stop();

    }

    reset();

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '2,1',
      filename: 'wipe'
    };

    monome[exports.hash] = exports;

    return exports;

  })();

  var veil = (function() {

    var callback = _.identity;
    var playing = false;

    var amount = Math.floor(Math.random()) * 8 + 8, w = width * Math.random(), h = height * Math.random();
    var distance = height, rotation = Math.PI / 2;

    var destinations = [];
    var points = _.map(_.range(amount), function(i) {
      var pct = i / amount;
      var theta = TWO_PI * pct;
      var x = distance * Math.sin(theta);
      var y = distance * Math.cos(theta);
      destinations.push(new Two.Vector(x, y));
      return new Two.Anchor(x, y);
    });

    var veil = two.makeCurve(points);
    veil.fill = colors.white;
    veil.noStroke();

    points = veil.vertices;

    var start = function(onComplete, silent) {
      veil.visible = true;
      _in.start();
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var update = function() {
      veil.fill = colors.white;
    };
    var resize = function() {};

    var options = { ending: 0 };

    var v, i, l, d, x, y, a, theta, ptheta;
    var _in = new TWEEN.Tween(options)
      .to({ ending: 1 }, duration * 0.75)
      .easing(Easing.Circular.In)
      .onStart(function() {
        playing = true;
      })
      .onUpdate(function() {
        var t = options.ending;
        for (i = 0; i < amount; i++) {
          v = points[i];
          d = destinations[i];
          x = lerp(v.x, d.x, t);
          y = lerp(v.y, d.y, t);
          v.set(x, y);
        }
      })
      .onComplete(function() {
        start.onComplete();
        callback();
      });

    function reset() {

      veil.visible = false;
      impact = new Two.Vector(Math.random() * width, Math.random() * height);
      var x, y, pos = Math.random() * 8;

      if (pos > 7) {
        // north
        x = center.x;
        y = 0;
      } else if (pos > 6) {
        // north-west
        x = 0;
        y = 0;
      } else if (pos > 5) {
        // west
        x = 0;
        y = center.y;
      } else if (pos > 4) {
        // south-west
        x = 0;
        y = height;
      } else if (pos > 3) {
        // south
        x = center.x;
        y = height;
      }  else if (pos > 2) {
        // south-east
        x = width;
        y = height;
      } else if (pos > 1) {
        // east
        x = width;
        y = center.y;
      } else {
        x = width;
        y = 0;
      }

      veil.translation.set(x, y);
      options.ending = 0;
      distance = height;

      for (i = 0; i < amount; i++) {
        v = points[i];
        pct = i / amount;
        ptheta = pct * TWO_PI;
        v.set(distance * Math.cos(ptheta), distance * Math.sin(ptheta));
        theta = angleBetween(v, impact) - ptheta;
        d = v.distanceTo(impact);
        a = 10 * distance / Math.sqrt(d);
        x = a * Math.cos(theta) + v.x;
        y = a * Math.sin(theta) + v.y;
        destinations[i].set(x, y);
      }

      playing = false;
      _in.stop();

    }

    reset();

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '1,1',
      filename: 'veil'
    };

    monome[exports.hash] = exports;

    return exports;

  })();

  var clay = (function() {

    var callback = _.identity;
    var playing = false;

    var amount = Math.floor(Math.random()) * 8 + 8, w = width * Math.random(), h = height * Math.random();
    var distance = height, rotation = Math.PI / 2;

    var destinations = [];
    var points = _.map(_.range(amount), function(i) {
      var pct = i / amount;
      var theta = TWO_PI * pct;
      var x = distance * Math.sin(theta);
      var y = distance * Math.cos(theta);
      destinations.push(new Two.Vector(x, y));
      return new Two.Anchor(x, y);
    });

    var clay = two.makeCurve(points);
    clay.fill = 'rgba(255,255,255,0.5)';
    clay.noStroke();

    points = clay.vertices;

    var start = function(onComplete, silent) {
      clay.visible = true;
      _in.start();
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var update = function() {
      clay.fill = 'rgba(255,255,255,0.5)';
    };
    var resize = function() {};

    var options = { ending: 0 };

    var v, i, l, d, x, y, a, theta, ptheta;
    var _in = new TWEEN.Tween(options)
      .to({ ending: 1 }, duration * 0.75)
      .easing(Easing.Circular.In)
      .onStart(function() {
        playing = true;
      })
      .onUpdate(function() {
        var t = options.ending;
        for (i = 0; i < amount; i++) {
          v = points[i];
          d = destinations[i];
          x = lerp(v.x, d.x, t);
          y = lerp(v.y, d.y, t);
          v.set(x, y);
        }
      })
      .onComplete(function() {
        start.onComplete();
        callback();
      });

    function reset() {

      clay.visible = false;
      impact = new Two.Vector(Math.random() * width, Math.random() * height);
      var x, y, pos = Math.random() * 8;

      if (pos > 7) {
        // north
        x = center.x;
        y = 0;
      } else if (pos > 6) {
        // north-west
        x = 0;
        y = 0;
      } else if (pos > 5) {
        // west
        x = 0;
        y = center.y;
      } else if (pos > 4) {
        // south-west
        x = 0;
        y = height;
      } else if (pos > 3) {
        // south
        x = center.x;
        y = height;
      }  else if (pos > 2) {
        // south-east
        x = width;
        y = height;
      } else if (pos > 1) {
        // east
        x = width;
        y = center.y;
      } else {
        x = width;
        y = 0;
      }

      clay.translation.set(x, y);
      options.ending = 0;
      distance = height;

      for (i = 0; i < amount; i++) {
        v = points[i];
        pct = i / amount;
        ptheta = pct * TWO_PI;
        v.set(distance * Math.cos(ptheta), distance * Math.sin(ptheta));
        theta = angleBetween(v, impact) - ptheta;
        d = v.distanceTo(impact);
        a = 10 * distance / Math.sqrt(d);
        x = a * Math.cos(theta) + v.x;
        y = a * Math.sin(theta) + v.y;
        destinations[i].set(x, y);
      }

      playing = false;
      _in.stop();

    }

    reset();

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '0,1',
      filename: 'clay'
    };

    monome[exports.hash] = exports;

    return exports;

  })();

  _.each(_.range(prismAmount), function(i) {

    var prism = (function() {

      var amount = Math.floor(i * 1.5) + 3, r1 = 100, r2 = 2, scalar = 10;
      var callback = _.identity;
      var playing = false;

      var circles = [];
      var points = _.map(_.range(amount*6), function(i) {
        var pct = i / amount;
        var theta = TWO_PI * pct;
        var x = r1 * Math.cos(theta);
        var y = r1 * Math.sin(theta);
        var circle = two.makeCircle(x, y, r2);
        circle.fill = radialGradient;
        circle.noStroke();
        circles.push(circle);
        return new Two.Anchor(x, y);
      });

      var prism = two.makePolygon(points);
      prism.stroke = colors.white;
      prism.fill = linearGradient;
      prism.linewidth = 0.5;

      var group = two.makeGroup(prism).add(circles);
      group.translation.set(center.x, center.y);

      var options = { ending: 0 };

      var start = function(onComplete, silent) {
        group.visible = true;
        _in.start();
        if (!silent && exports.sound) {
          exports.sound.stop().play();
        }
        if (_.isFunction(onComplete)) {
          callback = onComplete;
        }
      };

      start.onComplete = reset;

      var c, l;
      var update = function() {
        prism.stroke = linearGradient;
        for (i = 0, l = circles.length; i < l; i++) {
          c = circles[i];
          c.fill = linearGradient;
        }
      };
      var resize = function() {
        group.translation.set(center.x, center.y);
      };

      var _in = new TWEEN.Tween(options)
        .to({ ending: 1 }, duration * 0.75)
        .easing(Easing.Circular.In)
        .onStart(function() {
          playing = true;
        })
        .onUpdate(function() {
          group.scale = options.ending * scalar;
        })
        .onComplete(function() {
          start.onComplete();
          callback();
        });

      function reset() {
        group.visible = false;
        // group.rotation = Math.random() * TWO_PI;
        options.ending = group.scale = 0;
        playing = false;
        _in.stop();
      }

      reset();

      var exports = {
        start: start,
        update: update,
        clear: reset,
        resize: resize,
        playing: function() { return playing; },
        hash: i + ',6',
        filename: 'prism-' + (i + 1)
      };

      monome[exports.hash] = exports;

      return exports;

    })();

  });

  /**
   * BACKGROUND
   */

  var clay = (function() {

    var callback = _.identity;
    var playing = false;

    var amount = Math.floor(Math.random()) * 8 + 8, w = width * Math.random(), h = height * Math.random();
    var distance = height, rotation = Math.PI / 2;

    var destinations = [];
    var points = _.map(_.range(amount), function(i) {
      var pct = i / amount;
      var theta = TWO_PI * pct;
      var x = distance * Math.sin(theta);
      var y = distance * Math.cos(theta);
      destinations.push(new Two.Vector(x, y));
      return new Two.Anchor(x, y);
    });

    var clay = two.makeCurve(points);
    clay.fill = colors.foreground;
    clay.noStroke();

    points = clay.vertices;

    var start = function(onComplete, silent) {
      clay.visible = true;
      _in.start();
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var update = function() {
      clay.fill = colors.middleground;
    };
    var resize = function() {};

    var options = { ending: 0 };

    var v, i, l, d, x, y, a, theta, ptheta;
    var _in = new TWEEN.Tween(options)
      .to({ ending: 1 }, duration * 0.75)
      .easing(Easing.Circular.In)
      .onStart(function() {
        playing = true;
      })
      .onUpdate(function() {
        var t = options.ending;
        for (i = 0; i < amount; i++) {
          v = points[i];
          d = destinations[i];
          x = lerp(v.x, d.x, t);
          y = lerp(v.y, d.y, t);
          v.set(x, y);
        }
      })
      .onComplete(function() {
        start.onComplete();
        callback();
      });

    function reset() {

      clay.visible = false;
      impact = new Two.Vector(Math.random() * width, Math.random() * height);
      var x, y, pos = Math.random() * 8;

      if (pos > 7) {
        // north
        x = center.x;
        y = 0;
      } else if (pos > 6) {
        // north-west
        x = 0;
        y = 0;
      } else if (pos > 5) {
        // west
        x = 0;
        y = center.y;
      } else if (pos > 4) {
        // south-west
        x = 0;
        y = height;
      } else if (pos > 3) {
        // south
        x = center.x;
        y = height;
      }  else if (pos > 2) {
        // south-east
        x = width;
        y = height;
      } else if (pos > 1) {
        // east
        x = width;
        y = center.y;
      } else {
        x = width;
        y = 0;
      }

      clay.translation.set(x, y);
      options.ending = 0;
      distance = height;

      for (i = 0; i < amount; i++) {
        v = points[i];
        pct = i / amount;
        ptheta = pct * TWO_PI;
        v.set(distance * Math.cos(ptheta), distance * Math.sin(ptheta));
        theta = angleBetween(v, impact) - ptheta;
        d = v.distanceTo(impact);
        a = 10 * distance / Math.sqrt(d);
        x = a * Math.cos(theta) + v.x;
        y = a * Math.sin(theta) + v.y;
        destinations[i].set(x, y);
      }

      playing = false;
      _in.stop();

    }

    reset();

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '0,1',
      filename: 'clay'
    };

    monome[exports.hash] = exports;

    return exports;

  })(linearGradient);

  _.each(_.range(pistonAmount), function(i) {

    var pistons = (function() {

      var playing = false;
      var callback = _.identity;

      var amount = i * 1 + 2, w = width, h = height;
      var begin, end;

      var group = two.makeGroup();
      group.translation.copy(center);

      var shapes = _.map(_.range(amount), function(i) {

        var d = h / amount - h / (amount * 3);
        var x = 0;
        var y = - h / 2 + (i + 1) * (h / (amount + 1));

        var shape = two.makeCircle(x, y, w);

        shape.fill = radialGradient;
        shape.noStroke();

        group.add(shape);

        return shape;

      });

      var options = { ending: 0, beginning: 0 };

      var showShape = function(shape) {
        shape.visible = true;
      };

      var start = function(onComplete, silent) {
        _.each(shapes, showShape);
        _in.start();
        if (!silent && exports.sound) {
          exports.sound.stop().play();
        }
        if (_.isFunction(onComplete)) {
          callback = onComplete;
        }
      };

      start.onComplete = reset;

      var s, points;
      var update = function() {
        for (i = 0; i < amount; i++) {
          shapes[i].fill = radialGradient;
        }
      }; // Mainly for color in the future
      var resize = function() {
        w = width * 0.75, h = center.y;
        group.translation.copy(center);
      };

      var _in = new TWEEN.Tween(group)
        .to({rotation: Math.PI}, duration/2)
        .easing(Easing.Sinusoidal.Out)
        .onStart(function() {
          playing = true;
        })
        .onUpdate(function() {
          for (i = 0; i < amount; i++) {
            s = shapes[i];
            //s.rotation += 4 * Math.PI
            //points = s.vertices;
            //points.rotation += 4 * Math.PI
            //points[3].x = points[0].x = end * options.ending;
          }
        })
        .onComplete(function() {
          _out.start();
        });

      var _out = new TWEEN.Tween(group)
        .to({rotation: Math.PI / 2, scale: 0}, duration/2)
        .easing(Easing.Sinusoidal.Out)
        .onUpdate(function() {
          for (i = 0; i < amount; i++) {
            s = shapes[i];
            points = s.vertices;
            points[1].x = points[2].x = end * options.beginning;
          }
        })
        .onComplete(function() {
          start.onComplete();
          callback();
        });

      function reset() {

        options.beginning = options.ending = 0;
        var rotated = Math.random() > 0.5 ? true : false;

        if (rotated) {
          begin = - w ;
          end = w/2 ;
        } else {
          begin = w ;
          end = - w/2 ;
        }

        group.visible = false;
        group.scale = 1
        playing = false;

        _in.stop();
        _out.stop();

      }

      var exports = {
        start: start,
        update: update,
        clear: reset,
        resize: resize,
        playing: function() { return playing; },
        hash: i + ',3',
        filename: 'piston-' + (i + 1)
      };

      monome[exports.hash] = exports;

      reset();

      return exports;

    })();

  });

  _.each(_.range(flashAmount), function(i) {

    var flash = (function() {

      var playing = false;
      var callback = _.identity;

      var shape = two.makeRectangle(center.x, center.y, width, height);
      var timeout;
      shape.noStroke().fill = linearGradient;
      shape.visible = false;

      var start = function(onComplete, silent) {
        if (!_.isUndefined(timeout)) {
          clearTimeout(timeout);
          timeout = undefined;
        }
        playing = true;
        if (!silent && exports.sound) {
          exports.sound.stop().play();
        }
        timeout = setTimeout(function() {
          playing = false;
          callback();
          shape.visible = false;
        }, duration );
        if (_.isFunction(onComplete)) {
          callback = onComplete;
        }
      };

      var update = function() {
        shape.fill = linearGradient;
      };

      var resize = function() {
        var vertices = shape.vertices;
        vertices[0].set(- center.x, - center.y);
        vertices[1].set(center.x, - center.y);
        vertices[2].set(center.x, center.y);
        vertices[3].set(- center.x, center.y);
        shape.translation.copy(center);
      };

      two.bind('update', function() {
        if (!playing) {
          return;
        }
        shape.visible = Math.random() > 0.5;
      });

      var exports = {
        start: start,
        update: update,
        clear: _.identity,
        resize: resize,
        playing: function() { return playing; },
        hash: i + ',0',
        filename: 'flash-' + (i + 1)
      };

      monome[exports.hash] = exports;

      return exports;

    })();

  });

  var dotted_spiral = (function() {

    var playing = false;
    var callback = _.identity;
    var amount = 120, linewidth = min_dimension / (amount * 2), resolution = 4;
    var magnitude = min_dimension / 2;

    var lines = _.map(_.range(amount), function(i) {

      var pct = i / amount;
      var r = magnitude * pct;
      var theta = pct * Math.PI * resolution;

      var x1 = r * Math.cos(theta);
      var y1 = r * Math.sin(theta);

      pct = (i + 0.25) / amount;
      r = magnitude * pct;
      theta = pct * Math.PI * resolution;

      var x2 = r * Math.cos(theta);
      var y2 = r * Math.sin(theta);

      var line = two.makeLine(x1, y1, x2, y2);
      line.stroke = colors.white;
      line.linewidth = (1 - Math.sqrt(1 - pct)) * linewidth;
      line.cap = line.join = 'round';

      return line;

    });

    var updateLinewidth = function(line, i) {
      var pct = i / amount;
      line.linewidth = (Math.sqrt(1 - pct)) * linewidth;
    };

    lines.reverse();

    var group = two.makeGroup(lines);
    group.translation.set(center.x, center.y);

    var start = function(onComplete, silent) {
      _in.start();
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete
      }
    };

    start.onComplete = reset;

    var update = function() {
      group.stroke = colors.white;
    };
    var resize = function() {
      group.translation.set(center.x, center.y);
      linewidth = min_dimension / amount;
      _.each(lines, updateLinewidth);
    };

    var i, t, index;
    var _in = new TWEEN.Tween(group)
      .onStart(function() {
        playing = true;
      })
      .easing(Easing.Circular.In)
      .to({ rotation: Math.PI / 8, scale: 8 }, duration * 2)
      .onUpdate(function(u) {
        t = Math.min(map(u, 0, 0.25, 0, 1), 1);
        index = Math.floor(t * (amount));
        for (i = 0; i < index; i++) {
          lines[i].visible = true;
        }
      })
      .onComplete(function() {
        start.onComplete();
        callback();
      });

    var resetLine = function(l) {
      l.visible = false;
    };

    function reset() {

      _.each(lines, resetLine);

      group.rotation = Math.random() * TWO_PI;
      group.scale = 1;

      _in.to({ rotation: group.rotation + Math.PI / 8, scale: Math.random() * 2 + 10 }, duration * 2).stop();

      playing = false;

    }

    reset();

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '0,9',
      filename: 'dotted-spiral'
    };

    monome[exports.hash] = exports;

    return exports;

  })();

  var suspension = (function() {

    var playing = false;
    var callback = _.identity;
    var amount = 16, r1 = min_dimension * 12 / 900, r2 = min_dimension * 20 / 900, theta, deviation, distance = height;

    var destinations = [];
    var circles = _.map(_.range(amount), function(i) {
      var r = Math.round(map(Math.random(), 0, 1, r1, r2));
      var circle = two.makeCircle(0, 0, r);
      circle.fill = colors.white;
      circle.noStroke();
      destinations.push(new Two.Vector());
      return circle;
    });

    var group = two.makeGroup(circles);
    group.translation.set(center.x, center.y);

    var i, c;
    var start = function(onComplete, silent) {
      for (i = 0; i < amount; i++) {
        circles[i].visible = true;
      }
      _in.start();
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var update = function() {
      group.fill = colors.white;
    };
    var resize = function() {
      group.translation.set(center.x, center.y);
    };

    var options = { ending: 0 };

    var t, d, x, y;
    var _in = new TWEEN.Tween(options)
      .to({ ending: 1 }, duration * 0.5)
      .easing(Easing.Sinusoidal.Out)
      .onStart(function() {
        playing = true;
      })
      .onUpdate(function() {
        t = options.ending;
        for (i = 0; i < amount; i++) {
          c = circles[i];
          d = destinations[i];
          x = lerp(c.translation.x, d.x, t);
          y = lerp(c.translation.y, d.y, t);
          c.translation.set(x, y);
        }
      })
      .onComplete(function() {
        start.onComplete();
        callback();
      });

    function reset() {

      theta = Math.random() * TWO_PI;
      deviation = map(Math.random(), 0, 1, Math.PI / 4, Math.PI / 2);

      options.ending = 0;

      for (i = 0; i < amount; i++) {

        c = circles[i];
        t = theta + Math.random() * deviation * 2 - deviation;
        a = Math.random() * distance;
        x = a * Math.cos(t);
        y = a * Math.sin(t);
        destinations[i].set(x, y);

        c.visible = false;
        c.translation.set(0, 0);

      }

      playing = false;

      _in.stop();

    }

    reset();

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '0,5',
      filename: 'suspension'
    };

    monome[exports.hash] = exports;

    return exports;

  })();

  var confetti = (function() {

    var playing = false;
    var callback = _.identity;
    var amount = 32, r1 = min_dimension * 12 / 900,
      r2 = min_dimension * 20 / 900, theta, deviation, distance = width;

    var destinations = [];
    var circles = _.map(_.range(amount), function(i) {
      var r = Math.round(map(Math.random(), 0, 1, r1, r2));
      var circle = two.makeCircle(0, 0, r);
      circle.property = PROPERTIES[Math.floor(Math.random() * PROPERTIES.length)];
      circle.fill = colors[circle.property];
      circle.noStroke();
      destinations.push(new Two.Vector());
      return circle;
    });

    var group = two.makeGroup(circles);
    // group.translation.set(center.x, center.y);

    var showCircle = function(c) {
      c.visible = true;
    };

    var start = function(onComplete, silent) {
      _.each(circles, showCircle);
      _in.start();
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var updateCircleFill = function(circle) {
      circle.fill = colors[circle.property];
    };

    var update = function() {
      // group.fill = colors.white;
      _.each(circles, updateCircleFill);
    };
    var resize = function() {
      group.translation.set(center.x, center.y);
    };

    var options = { ending: 0 };

    var t, d, x, y, c, a;
    var _in = new TWEEN.Tween(options)
      .to({ ending: 1 }, duration * 0.5)
      .easing(Easing.Sinusoidal.Out)
      .onStart(function() {
        playing = true;
      })
      .onUpdate(function() {
        t = options.ending;
        for (i = 0; i < amount; i++) {
          c = circles[i];
          d = destinations[i];
          x = lerp(c.translation.x, d.x, t);
          y = lerp(c.translation.y, d.y, t);
          c.translation.set(x, y);
        }
      })
      .onComplete(function() {
        start.onComplete();
        callback();
      });

    function reset() {

      var ox, oy, pos = Math.random() * 4;

      if (pos > 3) {
        // west
        ox = - width / 8;
        oy = center.y;
      } else if (pos > 2) {
        // east
        ox = width * 1.125;
        oy = center.y;
      } else if (pos > 1) {
        // north
        ox = center.x;
        oy = - height / 8;
      } else {
        // west
        ox = center.x;
        oy = height * 1.125;
      }

      group.translation.set(ox, oy);

      theta = Math.atan2(center.y - oy, center.x - ox);
      deviation = Math.PI / 2;

      options.ending = 0;

      for (i = 0; i < amount; i++) {

        c = circles[i];
        t = theta + Math.random() * deviation * 2 - deviation;
        a = Math.random() * distance;
        x = a * Math.cos(t);
        y = a * Math.sin(t);
        destinations[i].set(x, y);

        c.visible = false;
        c.translation.set(0, 0);

      }

      playing = false;

      _in.stop();

    }

    reset();

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '2,5',
      filename: 'confetti'
    };

    monome[exports.hash] = exports;

    return exports;

  })();

  var timer = (function() {

    var callback = _.identity;
    var playing = false;
    var amount = 32, radius = min_dimension / 3;

    var points = _.map(_.range(amount), function(i) {

      var pct = i / (amount - 1);
      var theta = pct * TWO_PI;
      var x = radius * Math.cos(theta);
      var y = radius * Math.sin(theta);

      return new Two.Anchor(x, y);

    });

    points.push(points[0].clone(), points[1].clone());

    var timer = two.makeCurve(points, true);
    timer.stroke = linearGradient;
    timer.cap = 'butt';
    timer.linewidth = min_dimension / 10;
    timer.noFill();

    timer.translation.set(center.x, center.y);

    var start = function(onComplete, silent) {
      timer.visible = true;
      _in.start();
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var resizePoints = function(v, i) {
      var pct = i / amount;
      var theta = pct * TWO_PI;
      var x = radius * Math.cos(theta);
      var y = radius * Math.sin(theta);
      v.set(x, y);
    };

    var update = function() {
      timer.stroke = linearGradient;
    };
    var resize = function() {
      timer.translation.set(center.x, center.y);
      radius = min_dimension / 3
      timer.linewidth = min_dimension / 10;
      _.each(points, resizePoints);
    };

    var diretion = true, options = {
      beginning: 0,
      ending: 0
    };

    var _in = new TWEEN.Tween(options)
      .to({ ending: 1 }, duration / 3)
      .easing(Easing.Sinusoidal.Out)
      .onUpdate(function() {
        if (direction) {
          timer.ending = options.ending;
        } else {
          timer.beginning = 1 - options.ending;
        }
      })
      .onStart(function() {
        playing = true;
      })
      .onComplete(function() {
        _out.start();
      });

    var _out = new TWEEN.Tween(options)
      .to({ beginning: 1 }, duration / 3)
      .easing(Easing.Sinusoidal.In)
      .onUpdate(function() {
        if (direction) {
          timer.beginning = options.beginning;
        } else {
          timer.ending = 1 - options.beginning;
        }
      })
      .onComplete(function() {
        start.onComplete();
        callback();
      });

    function reset() {
      direction = Math.random() > 0.5;
      timer.visible = false;
      timer.rotation = TWO_PI * Math.random();
      options.ending = options.beginning = 0;
      timer.ending = timer.beginning = direction ? 0 : 1;
      playing = false;
      _in.stop();
      _out.stop();
    }

    reset();

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '0,4',
      filename: 'timer'
    };

    monome[exports.hash] = exports;

    return exports;

  })();

  var ufo = (function() {

    var playing = false;
    var callback = _.identity;

    var radius = min_dimension;
    var circle = two.makeCircle(0, 0, radius/4);
    circle.noStroke().fill = radialGradient;

    var start = function(onComplete, silent) {
      playing = true;
      _in.start();
      circle.visible = true;
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var update = function() {
      circle.fill = radialGradient;
    };
    var resize = function() {
      radius = min_dimension;
    };

    circle.destination = { y: center.y };

    var _in = new TWEEN.Tween(circle.translation)
      .to(circle.destination, duration / 2)
      .easing(Easing.Circular.Out)
      .onComplete(function() {
        _out.start();
      });

    var _out = new TWEEN.Tween(circle)
      .to({ scale: 0 }, duration / 2)
      .easing(Easing.Circular.Out)
      .onComplete(function() {
        playing = false;
        start.onComplete();
        callback();
      });

    function reset() {
      circle.visible = false;
      var right = Math.random() > 0.5;
      var top = Math.random() > 0.5;
      var x, y;
      if (right) {
        circle.translation.x = width/2;
      } else {
        circle.translation.x = width/2;
      }
      if (top) {
        circle.origin = circle.translation.y =  center.y;
      } else {
        circle.origin = circle.translation.y = center.y;
      }
      circle.destination.y = center.y;
      circle.scale = 1;
      _in.stop();
      _out.stop();
    }

    reset();

    var exports = {
      resize: resize,
      update: update,
      clear: reset,
      start: start,
      playing: function() { return playing; },
      hash: '1,2',
      filename: 'ufo'
    };

    monome[exports.hash] = exports;

    return exports;

  })();
  var splits = (function() {

    var playing = false;
    var callback = _.identity;

    var radius = min_dimension;
    var circle = two.makeCircle(0, 0, radius/4);
    circle.noStroke().fill = radialGradient;

    var start = function(onComplete, silent) {
      playing = true;
      _in.start();
      circle.visible = true;
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var update = function() {
      circle.fill = radialGradient;
    };
    var resize = function() {
      radius = min_dimension/4;
    };

    circle.destination = { y: center.y };

    var _in = new TWEEN.Tween(circle.translation)
      .to(circle.destination, duration / 2)
      .easing(Easing.Circular.Out)
      .onComplete(function() {
        _out.start();
      });

    var _out = new TWEEN.Tween(circle)
      .to({ scale: 0 }, duration / 2)
      .easing(Easing.Circular.Out)
      .onComplete(function() {
        playing = false;
        start.onComplete();
        callback();
      });

    function reset() {
      circle.visible = false;
      var right = Math.random() > 0.5;
      var top = Math.random() > 0.5;
      var x, y;
      if (right) {
        circle.translation.x = width * 0.75;
      } else {
        circle.translation.x = width * 0.25;
      }
      if (top) {
        circle.origin = circle.translation.y =  - center.y;
      } else {
        circle.origin = circle.translation.y = height * 1.5;
      }
      circle.destination.y = center.y;
      circle.scale = 1;
      _in.stop();
      _out.stop();
    }

    reset();

    var exports = {
      resize: resize,
      update: update,
      clear: reset,
      start: start,
      playing: function() { return playing; },
      hash: '2,2',
      filename: 'splits'
    };

    monome[exports.hash] = exports;

    return exports;

  })();
  var moon = (function() {

    var playing = false;
    var callback = _.identity;

    var radius = min_dimension/4;
    var circle = two.makeCircle(0, 0, radius);

    circle.noStroke().fill = radialGradient;

    var start = function(onComplete, silent) {
      playing = true;
      _in.start();
      circle.visible = true;
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var update = function() {
      circle.fill = radialGradient;
    };
    var resize = function() {
      radius = min_dimension/4;
    };

    circle.destination = { y: center.y };

    var _in = new TWEEN.Tween(circle.translation)
      .to(circle.destination, duration / 2)
      .easing(Easing.Circular.Out)
      .onComplete(function() {
        _out.start();
      });

    var _out = new TWEEN.Tween(circle)
      .to({ scale: 0 }, duration / 2)
      .easing(Easing.Circular.Out)
      .onComplete(function() {
        playing = false;
        start.onComplete();
        callback();
      });

    function reset() {
      circle.visible = false;
      var right = Math.random() > 0.5;
      var top = Math.random() > 0.5;
      var x, y;
      if (right) {
        circle.translation.x = width * 0.75;
      } else {
        circle.translation.x = width * 0.25;
      }
      if (top) {
        circle.origin = circle.translation.y =  - center.y;
      } else {
        circle.origin = circle.translation.y = height * 1.5;
      }
      circle.destination.y = center.y;
      circle.scale = 1;
      _in.stop();
      _out.stop();
    }

    reset();

    var exports = {
      resize: resize,
      update: update,
      clear: reset,
      start: start,
      playing: function() { return playing; },
      hash: '0,2',
      filename: 'moon'
    };

    monome[exports.hash] = exports;

    return exports;

  })();



  var strike = (function() {

    var playing = false;
    var callback = _.identity;

    var amount = 32;
    var distance = min_dimension * 0.5;

    var points = _.map(_.range(amount), function(i) {
      return new Two.Anchor();
    });
    var line = two.makePolygon(points, true);
    line.noFill().stroke = colors.white;
    line.translation.set(center.x, center.y);
    line.cap = 'round';

    var start = function(onComplete, silent) {
      line.visible = true;
      playing = true;
      animate_in.start();
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var resize = function() {
      // distance = height * 0.5;
      line.translation.set(center.x, center.y);
    };
    var update = function() {
      line.stroke = colors.white;
    };

    var animate_in = new TWEEN.Tween(line)
      .to({
        ending: 1.0
      }, duration * 0.25)
      .easing(Easing.Circular.In)
      .onComplete(function() {
        animate_out.start();
      });

    var animate_out = new TWEEN.Tween(line)
      .to({
        beginning: 1.0
      }, duration * 0.25)
      .easing(Easing.Circular.Out)
      .onComplete(function() {
        start.onComplete();
        callback();
      });

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '1,5',
      filename: 'strike'
    };

    var a = {
      x: 0, y: 0
    };
    var b = {
      x: 0, y: 0
    };

    var rando, theta, pct, i, p;
    function reset() {

      playing = false;
      rando = Math.random();

      line.linewidth = Math.round(rando * 7) + 3;
      distance = Math.round(map(rando, 0, 1, height * 0.5, width))

      theta = Math.random() * TWO_PI;
      a.x = distance * Math.cos(theta);
      a.y = distance * Math.sin(theta);

      theta = theta + Math.PI;
      b.x = distance * Math.cos(theta);
      b.y = distance * Math.sin(theta);

      line.ending = line.beginning = 0;
      line.visible = false;

      for (i = 0; i < amount; i++) {
        p = points[i];
        pct = i / (amount - 1);
        p.x = lerp(a.x, b.x, pct);
        p.y = lerp(a.y, b.y, pct);
      }

      animate_in.stop();
      animate_out.stop();

    }

    reset();

    monome[exports.hash] = exports;

    return exports;

  })();

  var zigzag = (function() {

    var playing = false;
    var callback = _.identity;

    var amount = 120, w = width / 16, phi = 6, h = height * 0.66;
    var offset = Math.PI * 0.5;

    var points = _.map(_.range(amount), function(i) {
      var pct = i / amount;
      var theta = TWO_PI * phi * pct + offset;
      var x = w * Math.sin(theta);
      var y = map(pct, 0, 1, - h / 2, h / 2);
      return new Two.Anchor(x, y);
    });

    var zigzag = two.makePolygon(points, true);
    zigzag.stroke = colors.white;
    zigzag.linewidth = min_dimension / 30;
    zigzag.noFill();
    zigzag.join = 'miter';
    zigzag.miter = 4;
    zigzag.cap = 'butt';

    var start = function(onComplete, silent) {
      zigzag.visible = true;
      _in.start();
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var update = function() {
      zigzag.stroke = colors.white;
    };
    var resize = function() {
      w = width / 16;
      h = height * 0.66;
    };

    var _in = new TWEEN.Tween(zigzag)
      .to({ ending: 1.0 }, duration * 0.25)
      .easing(Easing.Sinusoidal.Out)
      .onStart(function() {
        playing = true;
      })
      .onComplete(function() {
        _out.start();
      });

    var _out = new TWEEN.Tween(zigzag)
      .to({ beginning: 1.0 }, duration * 0.25)
      .easing(Easing.Sinusoidal.Out)
      .onComplete(function() {
        start.onComplete();
        callback();
      });

    var i, v, pct, theta, x, y, index;
    function reset() {

      if (Math.random() > 0.5) {
        zigzag.translation.set(width * 0.85, center.y);
      } else {
        zigzag.translation.set(width * 0.15, center.y);
      }

      zigzag.visible = false;
      index = Math.random() * 4;
      if (index > 3) {
        phi = 5;
      } else if (index > 2) {
        phi = 4;
      } else if (index > 1) {
        phi = 2;
      } else {
        phi = 1;
      }

      offset = Math.PI / 2;
      zigzag.rotation = Math.random() > 0.5 ? Math.PI : 0;
      x = 0;
      zigzag.beginning = zigzag.ending = 0;

      for (i = 0; i < amount; i++) {
        v = points[i];
        pct = i / amount;
        theta = Math.abs((((2 * (pct * TWO_PI * phi + offset) / Math.PI) - 1) % 4) - 2) - 1;
        x = theta * w / 2;
        y = map(pct, 0, 1, - h / 2, h / 2);
        v.set(x, y);
      }
      playing = false;

      _in.stop();
      _out.stop();

    }

    reset();

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '1,8',
      filename: 'zig-zag'
    };

    monome[exports.hash] = exports;

    return exports;

  })();

  var squiggle = (function() {

    var playing = false;
    var callback = _.identity;
    var amount = 200, w = center.x, phi = 6, h = height * 0.33;
    var offset = Math.PI * 0.5;

    var points = _.map(_.range(amount), function(i) {
      var pct = i / amount;
      var theta = TWO_PI * phi * pct + offset;
      var x = map(pct, 0, 1, - w / 2, w / 2);
      var y = h * Math.sin(theta);
      return new Two.Anchor(x, y);
    });

    var squiggle = two.makePolygon(points, true);
    squiggle.translation.set(center.x, center.y);
    squiggle.stroke = colors.accent;
    squiggle.linewidth = min_dimension / 40;
    squiggle.cap = squiggle.join = 'round';
    squiggle.noFill();

    // points = squiggle.vertices;

    var start = function(onComplete, silent) {
      squiggle.visible = true;
      playing = true;
      _in.start();
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var update = function() {
      squiggle.stroke = colors.accent;
    };
    var resize = function() {
      w = center.x;
      h = height * 0.33;
      squiggle.linewidth = min_dimension / 40;
      squiggle.translation.set(center.x, center.y);
    };

    // var options = { ending: 0, beginning: 0 };

    var _in = new TWEEN.Tween(squiggle)
      .to({ ending: 1.0 }, duration / 2)
      .easing(Easing.Sinusoidal.Out)
      .onComplete(function() {
        _out.start();
      });

    var _out = new TWEEN.Tween(squiggle)
      .to({ beginning: 1.0 }, duration / 2)
      .easing(Easing.Sinusoidal.In)
      .onComplete(function() {
        start.onComplete();
        callback();
      });

    var i, v, pct, theta, x, y;
    function reset() {
      squiggle.visible = false;
      phi = Math.round(Math.random() * 6) + 1;
      offset = Math.PI / 2;
      squiggle.rotation = Math.random() > 0.5 ? Math.PI : 0;
      squiggle.ending = squiggle.beginning = 0;
      for (i = 0; i < amount; i++) {
        v = points[i];
        pct = i / amount;
        theta = TWO_PI * phi * pct + offset;
        x = map(pct, 0, 1, - w / 2, w / 2);
        y = h * Math.sin(theta);
        v.set(x, y);
      }
      playing = false;
      _in.stop();
      _out.stop();
    }

    reset();

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '0,7',
      filename: 'squiggle'
    };

    monome[exports.hash] = exports;

    return exports;

  })();

  var bubbles = (function() {

    var callback = _.identity;
    var playing = false;
    var amount = 24, radius = min_dimension * .33;
    var last = amount - 1;
    var dur = duration * 0.2;
    var bubbleRadius = min_dimension * 10 / 900;
    var direction = true;

    var circles = _.map(_.range(amount), function(i) {

      var pct = i / last;
      var theta = pct * TWO_PI;
      var x = radius * Math.cos(theta);
      var y = radius * Math.sin(theta);

      var circle = two.makeCircle(radius, 0, bubbleRadius);
      circle.theta = 0;
      circle.destination = theta;
      return circle;

    });

    var shape = two.makeGroup(circles);
    shape.noStroke().fill = colors.white;
    shape.translation.set(center.x, center.y);

    var start = function(onComplete, silent) {
      playing = true;
      ins[0].start();
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var update = function() {
      shape.fill = colors.white;
    };
    var resize = function() {
      shape.translation.set(center.x, center.y);
      radius = min_dimension * .33;
    };

    var options = { ending: 0, beginning: 0 };
    var diretion = true;

    var theta, x, y, next, tween;
    var ins = _.map(circles, function(c, i) {

      return new TWEEN.Tween(c)
        .to({ theta: c.destination }, dur / (i + 1))
        .onStart(function() {
          c.visible = true;
        })
        .onUpdate(function(t) {
          theta = direction ? c.theta : - c.theta;
          x = radius * Math.cos(theta);
          y = radius * Math.sin(theta);
          c.translation.set(x, y);
        })
        .onComplete(function() {

          if (i >= last) {
            outs[0].start();
            return;
          }

          next = circles[i + 1];
          tween = ins[i + 1];
          next.theta = c.theta;
          next.translation.copy(c.translation);
          tween.start();

        });

    });

    var outs = _.map(circles, function(c, i) {

      next = circles[i + 1];
      if (!next) {
        next = TWO_PI;
      } else {
        next = next.destination;
      }

      return new TWEEN.Tween(c)
        .to({ theta: next }, dur / (amount - (i + 1)))
        // .easing(Easing.Circular.Out)
        .onUpdate(function(t) {
          theta = direction ? c.theta : - c.theta;
          x = radius * Math.cos(theta);
          y = radius * Math.sin(theta);
          c.translation.set(x, y);
        })
        .onComplete(function() {

          c.visible = false;

          if (i >= last - 1) {
            callback();
            start.onComplete();
            return;
          }

          tween = outs[i + 1].start();

        });

    });

    var c;
    function reset() {
      direction = Math.random() > 0.5;
      shape.visible = false;
      shape.rotation = TWO_PI * Math.random();
      playing = false;
      for (i = 0; i < amount; i++) {
        c = circles[i];
        c.theta = 0;
        c.translation.set(radius, 0);
        ins[i].stop();
        outs[i].stop();
      }
    }

    reset();

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '1,4',
      filename: 'bubbles'
    };

    monome[exports.hash] = exports;

    return exports;

  })();

  var corona = (function() {

    var callback = _.identity;
    var playing = false;

    var amount = 32, radius = min_dimension * .45;
    var last = amount - 1;
    var dur = duration * 0.1;
    var bubbleRadius = height * 12 / 900;
    var direction = true;

    var circles = _.map(_.range(amount), function(i) {

      var pct = i / last;
      var theta = pct * TWO_PI;
      var x = radius * Math.cos(theta);
      var y = radius * Math.sin(theta);

      var circle = makeTriangle(radius, 0, bubbleRadius);
      circle.theta = 0;
      circle.destination = theta;
      return circle;

    });

    var shape = two.makeGroup(circles);
    shape.noStroke().fill = colors.highlight;
    shape.translation.set(center.x, center.y);

    var start = function(onComplete, silent) {
      playing = true;
      ins[0].start();
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var update = function() {
      shape.fill = colors.highlight;
    };
    var resize = function() {
      shape.translation.set(center.x, center.y);
      radius = min_dimension * .45;
    };

    var options = { ending: 0, beginning: 0 };
    var diretion = true;

    var theta, x, y, next, tween;
    var ins = _.map(circles, function(c, i) {

      return new TWEEN.Tween(c)
        .to({ theta: c.destination }, dur / (i + 1))
        .onStart(function() {
          c.visible = true;
        })
        .onUpdate(function(t) {
          theta = direction ? c.theta : - c.theta;
          x = radius * Math.cos(theta);
          y = radius * Math.sin(theta);
          c.translation.set(x, y);
          c.rotation = theta;
        })
        .onComplete(function() {

          if (i >= last) {
            outs[0].start();
            return;
          }

          next = circles[i + 1];
          tween = ins[i + 1];
          next.theta = c.theta;
          next.translation.copy(c.translation);
          tween.start();

        });

    });

    var outs = _.map(circles, function(c, i) {

      next = circles[i + 1];
      if (!next) {
        next = TWO_PI;
      } else {
        next = next.destination;
      }

      return new TWEEN.Tween(c)
        .to({ theta: next }, dur / (amount - (i + 1)))
        // .easing(Easing.Circular.Out)
        .onUpdate(function(t) {
          theta = direction ? c.theta : - c.theta;
          x = radius * Math.cos(theta);
          y = radius * Math.sin(theta);
          c.translation.set(x, y);
          c.rotation = theta;
        })
        .onComplete(function() {

          c.visible = false;

          if (i >= last - 1) {
            callback();
            start.onComplete();
            return;
          }

          tween = outs[i + 1].start();

        });

    });

    var c, i;
    function reset() {
      direction = Math.random() > 0.5;
      shape.visible = false;
      shape.rotation = TWO_PI * Math.random();
      playing = false;
      for (i = 0; i < amount; i++) {
        c = circles[i];
        c.theta = 0;
        c.translation.set(radius, 0);
        ins[i].stop();
        outs[i].stop();
      }
    }

    reset();

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '2,4',
      filename: 'corona'
    };

    monome[exports.hash] = exports;

    return exports;

  })();

  var pinwheel = (function() {

    var playing = false;
    var callback = _.identity;

    var amount = 8;
    var dur = duration / (amount + 2);
    var distance = height / 5;
    var startAngle = 0;
    var endAngle = TWO_PI;
    var drift = Math.random() * TWO_PI;

    var points = _.map(_.range(amount), function(i) {
      return new Two.Anchor();
    });

    var shape = two.makePolygon(points);
    shape.fill = colors.highlight;
    shape.noStroke();
    shape.translation.set(center.x, center.y);

    var i, l, tween;
    var start = function(onComplete, silent) {
      playing = true;
      shape.visible = true;
      for (i = 0, l = sequence[0].length; i < l; i++) {
        tween = sequence[0][i];
        tween.start();
      }
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    };

    start.onComplete = reset;

    var update = function() {
      shape.fill = colors.highlight;
    };
    var resize = function() {
      distance = height / 6;
      shape.translation.set(center.x, center.y);
    };

    var sequence = [];

    var startTween = function(tween) {
      tween.start();
    };

    _.each(_.range(amount), function(i) {

      var index = i + 1;
      var center = Math.PI * (index / amount);

      var parallel = [];

      _.each(_.range(amount), function(j) {

        var pct = Math.min(j / index, 1.0);
        var theta = pct * endAngle + startAngle + center + drift;
        var p = points[j];
        var x = distance * Math.cos(theta);
        var y = distance * Math.sin(theta);

        var tween = new TWEEN.Tween(p)
          .to({
            x: x,
            y: y
          }, dur)
          .easing(Easing.Sinusoidal.Out);

        parallel.push(tween);

      });

      var tween = parallel[0];
      tween.onComplete(function() {
        var parallel = sequence[index];
        if (_.isArray(parallel)) {
          _.each(parallel, startTween);
          return;
        }
        tween_out.start();
      });

      sequence.push(parallel);

    });

    var tween_out = new TWEEN.Tween(shape)
      .to({
        scale: 0
      }, dur)
      .easing(Easing.Sinusoidal.Out)
      .onComplete(function() {
        start.onComplete();
        callback();
        playing = false;
      });

    var iterateSequences = function(parallel) {
      _.each(parallel, stopTween);
    };

    var stopTween = function(tween) {
      tween.stop();
    };

    var p, pct, theta, x, y;
    function reset() {
      shape.visible = false;
      shape.rotation = Math.random() * TWO_PI;
      for (i = 0, l = points.length; i < l; i++) {
        p = points[i];
        pct = i / amount;
        theta = startAngle;
        x = distance * Math.cos(theta);
        y = distance * Math.sin(theta);
        p.set(x, y);
      }
      shape.scale = 1;
      shape._update();
      tween_out.stop();
      _.each(sequence, iterateSequences);
    }

    reset();

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '1,7',
      filename: 'pinwheel'
    };

    monome[exports.hash] = exports;

    return exports;


  })();

  var glimmer = (function() {

    var playing = false;
    var callback = _.identity;
    var amount = 12, r1 = height * 20 / 900, r2 = height * 40 / 900;

    var longest = 0, index;

    var circles = _.map(_.range(amount), function(i) {
      var r = Math.round(map(Math.random(), 0, 1, r1, r2));
      var delay = Math.random() * duration * 0.5;
      var circle = two.makeCircle(0, 0, r);
      circle.key = colors.getRandomKey();
      circle.stroke = colors[circle.key];
      circle.noFill();
      circle.__linewidth = Math.random() * 20 + 40;
      circle.tween = new TWEEN.Tween(circle)
        .to({ scale: 1, linewidth: 0 }, duration * 0.2)
        .easing(Easing.Sinusoidal.Out)
        .delay(delay)
        .onComplete(function() {
          circle.visible = false;
        });

      if (longest < delay) {
        longest = delay;
        index = i;
      }

      return circle;

    });

    circles[index].tween
      .onComplete(function() {
        circles[index].visible = false;
        start.onComplete();
        callback();
      });


    var group = two.makeGroup(circles);
    group.translation.set(center.x, center.y);

    var i, c;
    var start = function(onComplete, silent) {
      playing = true;
      for (i = 0; i < amount; i++) {
        c = circles[i];
        c.visible = true;
        c.tween.start();
      }
      if (!silent && exports.sound) {
        exports.sound.stop().play();
      }
      if (_.isFunction(onComplete)) {
        callback = onComplete;
      }
    }

    start.onComplete = reset;

    var update = function() {
      for (i = 0; i < amount; i++) {
        circles[i].stroke = colors[circles[i].key];
      }
    };
    var resize = function() {
      group.translation.set(center.x, center.y);
    };

    var theta, x, y;
    function reset() {

      for (i = 0; i < amount; i++) {

        c = circles[i];

        theta = TWO_PI * Math.random();

        x = Math.random() * center.y * Math.cos(theta);
        y = Math.random() * center.y * Math.sin(theta);

        c.translation.set(x, y);
        c.visible = false;
        c.scale = 0;
        c.linewidth = c.__linewidth;

        c.tween.stop();

      }

      playing = false;

    }

    reset();

    var exports = {
      start: start,
      update: update,
      clear: reset,
      resize: resize,
      playing: function() { return playing; },
      hash: '0,8',
      filename: 'glimmer'
    };

    monome[exports.hash] = exports;

    return exports;

  })();

  var iterateResize = function(o) {
    if (o.resize) {
      o.resize();
    }
  };

  // two.bind('resize', function() {
  $(window).bind('resize', function() {

    var rect = container.getBoundingClientRect();
    two.renderer.setSize(rect.width, rect.height, animationRatio);

    two.width = rect.width;
    two.height = rect.height;

    width = two.width;
    height = two.height;

    center.x = width / 2;
    center.y = height / 2;

    min_dimension = width > height ? height : width;

    _.each(animations.map, iterateResize);

  });

  var changedColors = true;
  var changeColors = {};

  changeColors.start = function(onComplete) {
    current = (current + 1) % PALETTE.length;
    // _.each(exports.list, iterateSoundUpdate);
    exports.updateAudio();
    changedColors = false;
    if (_.isFunction(onComplete)) {
      changeColors.callback = onComplete;
    }
  };

  changeColors.hash = '3,';

  changeColors.callback = _.identity;

  changeColors.playing = function() {
    return !changedColors;
  };

  changeColors.onComplete = function() {
    changeColors.callback();
  };

  changeColors.clear = _.identity;

  _.each(_.range(8), function(i) {
    monome[changeColors.hash + i] = changeColors;
  });
  monome['2,7'] = changeColors;  // Export for mobile

  var iterateSoundUpdate = function(o) {
    if (!_.isArray(o.sounds)) {
      return;
    }
    o.sound = o.sounds[current % o.sounds.length];
  };

  var iterateUpdate = function(o) {
    if (_.isFunction(o.update)) {
      o.update();
    }
  };

  var setColors = function(palette) {

    amount = 0;

    for (k in _colors) {

      v = _colors[k];
      c = palette[k];

      v.r = c.r;
      v.g = c.g;
      v.b = c.b;

      amount++;

      colors[k] = toRGB(v);

    }

    return amount;

  };

  var tweenColors = function(palette) {

    amount = 0;

    for (k in _colors) {

      v = _colors[k];

      c = palette[k];
      r = v.r, g = v.g, b = v.b;

      if (colorsEqual(c, v)) {
        amount++;
      }

      v.r = ease(r, c.r, drag);
      v.g = ease(g, c.g, drag);
      v.b = ease(b, c.b, drag);

      colors[k] = toRGB(v);

    }

    return amount;

  };

  var palette, amount, c, r, g, b, k, v;
  var exports = {

    initializeSound: function() {

      exports.updateAudio();
      return exports;

    },

    updateAudio: function(callback) {

      var letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      var path = window.location.href.match(/localhost/i) ? '/assets/' : '//d3o508uuo64enc.cloudfront.net/';
      var filetype = '.mp3';
      var list = _.filter(exports.list, function(o) {
        return _.isArray(o.sounds);
      });

      var type = letters[current];
      var $lobby = $('#lobby');
      var $loaded = $lobby.find('#loaded');
      var $totalAssets = $lobby.find('#total-assets');

      $loaded.update = function() {
        $loaded.index++;
        $loaded.html($loaded.index);
      };

      var show = _.once(function() {
        $loaded.index = 0;
        $loaded.html($loaded.index);
        $totalAssets.html(list.length);
        $lobby.fadeIn();
      });

      var buffered = _.after(list.length, function() {
        if (_.isFunction(callback)) {
          callback();
        } else {
          $('#lobby').fadeOut();
        }
      });

      _.each(list, function(o) {
        var sound = o.sounds[current];
        if (!sound) {
          show();
          sound = new Sound(path + type + '/' + o.filename + filetype, function() {
            $loaded.update();
            buffered();
          });
          o.sounds.push(sound);
        }
        o.sound = sound;
      });

      return exports;


    },

    // An update loop

    update: function() {

      if (changedColors) {
        return exports;
      }

      palette = PALETTE[current];

      if (has.mobile) {
        amount = setColors(palette);
      } else {
        amount = tweenColors(palette);
      }

      _.each(exports.list, iterateUpdate);
      domElement.style.background = colors.background;

      if (amount >= PALETTE.length) {

        if (!changedColors) {
          changedColors = true;
          changeColors.onComplete();
        }

        // return exports;

      }

      return exports;

    },

    map: monome,

    list: _.toArray(monome),

    getColorPalette: function() {
      return PALETTE[current];
    }

  };

  return exports;

})();

function makeTriangle(x, y, radius) {
  var t1 = TWO_PI * .33;
  var t2 = TWO_PI * .66;
  var t3 = TWO_PI;
  var points = [
    new Two.Anchor(radius * Math.cos(t1) + x, radius * Math.sin(t1) + y),
    new Two.Anchor(radius * Math.cos(t2) + x, radius * Math.sin(t2) + y),
    new Two.Anchor(radius * Math.cos(t3) + x, radius * Math.sin(t3) + y)
  ];
  var shape = two.makePolygon(points);
  return shape;
}

function colorsEqual(c1, c2, t) {
  var threshold = t || 0.25;
  return Math.abs(c1.r - c2.r) < threshold
    && Math.abs(c1.g - c2.g) < threshold
    && Math.abs(c1.b - c2.b) < threshold;
}

function ease(cur, dest, t) {
  var d = dest - cur;
  if (Math.abs(d) <= 0.0001) {
    return dest;
  } else {
    return cur + d * t;
  }
}

function toRGB(o) {
  return 'rgb(' + Math.round(o.r) + ',' + Math.round(o.g) + ',' + Math.round(o.b) + ')';
}

function angleBetween(v1, v2) {
  var dx = v2.x - v1.x;
  var dy = v2.y - v2.y;
  return Math.atan2(dy, dx);
}

function negate(v) {
  return v * -1;
}

function lerp(a, b, t) {
  return (b - a) * t + a;
}

function map(v, i1, i2, o1, o2) {
  return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
}

function sigmoid(a, b, t, k) {
  var k = k || 0.2;
  return lerp(a, b, (k * t) / ((1 + k) * t));
}



