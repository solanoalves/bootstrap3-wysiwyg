(function (factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('bootstrap.wysihtml5', ['jquery', 'wysihtml5', 'bootstrap', 'bootstrap.wysihtml5.templates', 'bootstrap.wysihtml5.commands'], factory);
  } else {
    // Browser globals
    factory(jQuery, wysihtml5); // jshint ignore:line
  }
}(function ($, wysihtml5) {
  'use strict';
  var bsWysihtml5 = function($, wysihtml5) {

    var templates = function(key, locale, options) {
      if(wysihtml5.tpl[key]) {
        return wysihtml5.tpl[key]({locale: locale, options: options});
      }
    };

    var Wysihtml5 = function(el, options) {
      this.el = el;
      var toolbarOpts = $.extend(true, {}, defaultOptions, options);
      for(var t in toolbarOpts.customTemplates) {
        if (toolbarOpts.customTemplates.hasOwnProperty(t)) {
          wysihtml5.tpl[t] = toolbarOpts.customTemplates[t];
        }
      }
      this.toolbar = this.createToolbar(el, toolbarOpts);
      this.editor =  this.createEditor(toolbarOpts);
    };

    Wysihtml5.prototype = {

      constructor: Wysihtml5,

      createEditor: function(options) {
        options = options || {};

        // Add the toolbar to a clone of the options object so multiple instances
        // of the WYISYWG don't break because 'toolbar' is already defined
        options = $.extend(true, {}, options);
        options.toolbar = this.toolbar[0];

        return this.initializeEditor(this.el[0], options);
      },


      initializeEditor: function(el, options) {
        var editor = new wysihtml5.Editor(this.el[0], options);

        editor.on('beforeload', this.syncBootstrapDialogEvents);
        editor.on('beforeload', this.loadParserRules);

        // #30 - body is in IE 10 not created by default, which leads to nullpointer
        // 2014/02/13 - adapted to wysihtml5-0.4, does not work in IE
        if(editor.composer.editableArea.contentDocument) {
          this.addMoreShortcuts(editor,
                                editor.composer.editableArea.contentDocument.body || editor.composer.editableArea.contentDocument,
                                options.shortcuts);
        } else {
          this.addMoreShortcuts(editor, editor.composer.editableArea, options.shortcuts);
        }

        if(options && options.events) {
          for(var eventName in options.events) {
            if (options.events.hasOwnProperty(eventName)) {
              editor.on(eventName, options.events[eventName]);
            }
          }
        }

        return editor;
      },

      loadParserRules: function() {
        if($.type(this.config.parserRules) === 'string') {
          $.ajax({
            dataType: 'json',
            url: this.config.parserRules,
            context: this,
            error: function (jqXHR, textStatus, errorThrown) {
              console.log(errorThrown);
            },
            success: function (parserRules) {
              this.config.parserRules = parserRules;
              console.log('parserrules loaded');
            }
          });
        }

        if(this.config.pasteParserRulesets && $.type(this.config.pasteParserRulesets) === 'string') {
          $.ajax({
            dataType: 'json',
            url: this.config.pasteParserRulesets,
            context: this,
            error: function (jqXHR, textStatus, errorThrown) {
              console.log(errorThrown);
            },
            success: function (pasteParserRulesets) {
              this.config.pasteParserRulesets = pasteParserRulesets;
            }
          });
        }
      },

      //sync wysihtml5 events for dialogs with bootstrap events
      syncBootstrapDialogEvents: function() {
        var editor = this;
        $.map(this.toolbar.commandMapping, function(value) {
          return [value];
        }).filter(function(commandObj) {
          return commandObj.dialog;
        }).map(function(commandObj) {
          return commandObj.dialog;
        }).forEach(function(dialog) {
          dialog.on('show', function() {
            $(this.container).modal('show');
          });
          dialog.on('hide', function() {
            $(this.container).modal('hide');
            setTimeout(editor.composer.focus, 0);
          });
          $(dialog.container).on('shown.bs.modal', function () {
            $(this).find('input, select, textarea').first().focus();
          });
        });
        this.on('change_view', function() {
          $(this.toolbar.container.children).find('a.btn').not('[data-wysihtml5-action="change_view"]').toggleClass('disabled');
        });
      },

      createToolbar: function(el, options) {
        var self = this;
        var toolbar = $('<ul/>', {
          'class' : 'wysihtml5-toolbar',
          'style': 'display:none'
        });
        var culture = options.locale || defaultOptions.locale || 'en';
        if(!locale.hasOwnProperty(culture)) {
          console.debug('Locale \'' + culture + '\' not found. Available locales are: ' + Object.keys(locale) + '. Falling back to \'en\'.');
          culture = 'en';
        }
        var localeObject = $.extend(true, {}, locale.en, locale[culture]);
        for(var key in options.toolbar) {
          if(options.toolbar[key]) {
            toolbar.append(templates(key, localeObject, options));
          }
        }

        toolbar.find('a[data-wysihtml5-command="formatBlock"]').click(function(e) {
          var target = e.delegateTarget || e.target || e.srcElement,
          el = $(target),
          showformat = el.data('wysihtml5-display-format-name'),
          formatname = el.data('wysihtml5-format-name') || el.html();
          if(showformat === undefined || showformat === 'true') {
            self.toolbar.find('.current-font').text(formatname);
          }
        });

        toolbar.find('a[data-wysihtml5-command="fontSize"]').click(function(e) {
          var target = e.delegateTarget || e.target || e.srcElement,
          el = $(target),
          showformat = el.data('wysihtml5-display-format-name'),
          formatname = el.data('wysihtml5-format-name') || el.html();
          if(showformat === undefined || showformat === 'true') {
            self.toolbar.find('.current-size').text(formatname);
          }
        });

        toolbar.find('a[data-wysihtml5-command="foreColor"]').click(function(e) {
          var target = e.target || e.srcElement;
          var el = $(target);
          self.toolbar.find('.current-color').text(el.html());
        });

        this.el.before(toolbar);

        return toolbar;
      },

      addMoreShortcuts: function(editor, el, shortcuts) {
        /* some additional shortcuts */
        wysihtml5.dom.observe(el, 'keydown', function(event) {
          var keyCode  = event.keyCode,
          command  = shortcuts[keyCode];
          if ((event.ctrlKey || event.metaKey || event.altKey) && command && wysihtml5.commands[command]) {
            var commandObj = editor.toolbar.commandMapping[command + ':null'];
            if (commandObj && commandObj.dialog && !commandObj.state) {
              commandObj.dialog.show();
            } else {
              wysihtml5.commands[command].exec(editor.composer, command);
            }
            event.preventDefault();
          }
        });
      }
    };

    // these define our public api
    var methods = {
      resetDefaults: function() {
        $.fn.wysihtml5.defaultOptions = $.extend(true, {}, $.fn.wysihtml5.defaultOptionsCache);
      },
      bypassDefaults: function(options) {
        return this.each(function () {
          var $this = $(this);
          $this.data('wysihtml5', new Wysihtml5($this, options));
        });
      },
      shallowExtend: function (options) {
        var settings = $.extend({}, $.fn.wysihtml5.defaultOptions, options || {}, $(this).data());
        var that = this;
        return methods.bypassDefaults.apply(that, [settings]);
      },
      deepExtend: function(options) {
        var settings = $.extend(true, {}, $.fn.wysihtml5.defaultOptions, options || {});
        var that = this;
        return methods.bypassDefaults.apply(that, [settings]);
      },
      init: function(options) {
        var that = this;
        return methods.shallowExtend.apply(that, [options]);
      }
    };

    $.fn.wysihtml5 = function ( method ) {
      if ( methods[method] ) {
        return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
      } else if ( typeof method === 'object' || ! method ) {
        return methods.init.apply( this, arguments );
      } else {
        $.error( 'Method ' +  method + ' does not exist on jQuery.wysihtml5' );
      }
    };

    $.fn.wysihtml5.Constructor = Wysihtml5;

    var defaultOptions = $.fn.wysihtml5.defaultOptions = {
      toolbar: {
        'font-size': true,
        'font-styles': true,
        'color': false,
        'emphasis': {
          'small': true
        },
        'blockquote': true,
        'lists': true,
        'html': false,
        'link': true,
        'image': true,
        'smallmodals': false
      },
      useLineBreaks: false,
      parserRules: {
       "classes": {
        "wysiwyg-clear-both": 1,
        "wysiwyg-clear-left": 1,
        "wysiwyg-clear-right": 1,
        "wysiwyg-color-aqua": 1,
        "wysiwyg-color-black": 1,
        "wysiwyg-color-blue": 1,
        "wysiwyg-color-fuchsia": 1,
        "wysiwyg-color-gray": 1,
        "wysiwyg-color-green": 1,
        "wysiwyg-color-lime": 1,
        "wysiwyg-color-maroon": 1,
        "wysiwyg-color-navy": 1,
        "wysiwyg-color-olive": 1,
        "wysiwyg-color-purple": 1,
        "wysiwyg-color-red": 1,
        "wysiwyg-color-silver": 1,
        "wysiwyg-color-teal": 1,
        "wysiwyg-color-white": 1,
        "wysiwyg-color-yellow": 1,
        "wysiwyg-float-left": 1,
        "wysiwyg-float-right": 1,
        "wysiwyg-font-size-x8": 1,
        "wysiwyg-font-size-x9": 1,
        "wysiwyg-font-size-x10": 1,
        "wysiwyg-font-size-x11": 1,
        "wysiwyg-font-size-x12": 1,
        "wysiwyg-font-size-x13": 1,
        "wysiwyg-font-size-x14": 1,
        "wysiwyg-font-size-x15": 1,
        "wysiwyg-font-size-x16": 1,
        "wysiwyg-font-size-x17": 1,
        "wysiwyg-font-size-x18": 1,
        "wysiwyg-font-size-x19": 1,
        "wysiwyg-font-size-x20": 1,
        "wysiwyg-font-size-x21": 1,
        "wysiwyg-font-size-x22": 1,
        "wysiwyg-font-size-x23": 1,
        "wysiwyg-font-size-x24": 1,
        "wysiwyg-text-align-center": 1,
        "wysiwyg-text-align-justify": 1,
        "wysiwyg-text-align-left": 1,
        "wysiwyg-text-align-right": 1
       },
       "tags": {
        "a": {
         "check_attributes": {
          "href": "url",
          "target": "any"
         },
         "set_attributes": {
          "rel": "nofollow"
         }
        },
        "abbr": {
         "rename_tag": "span"
        },
        "acronym": {
         "rename_tag": "span"
        },
        "address": {
         "rename_tag": "div"
        },
        "applet": {
         "remove": 1
        },
        "area": {
         "remove": 1
        },
        "article": {
         "rename_tag": "div"
        },
        "aside": {
         "rename_tag": "div"
        },
        "audio": {
         "remove": 1
        },
        "b": {},
        "base": {
         "remove": 1
        },
        "basefont": {
         "remove": 1
        },
        "bdi": {
         "rename_tag": "span"
        },
        "bdo": {
         "rename_tag": "span"
        },
        "bgsound": {
         "remove": 1
        },
        "big": {
         "rename_tag": "span",
         "set_class": "wysiwyg-font-size-larger"
        },
        "blink": {
         "rename_tag": "span"
        },
        "blockquote": {
         "check_attributes": {
          "cite": "url"
         }
        },
        "body": {
         "rename_tag": "div"
        },
        "br": {
         "add_class": {
          "clear": "clear_br"
         }
        },
        "button": {
         "rename_tag": "span"
        },
        "canvas": {
         "remove": 1
        },
        "caption": {
         "add_class": {
          "align": "align_text"
         }
        },
        "center": {
         "rename_tag": "div",
         "set_class": "wysiwyg-text-align-center"
        },
        "cite": {},
        "code": {},
        "col": {
         "remove": 1
        },
        "colgroup": {
         "remove": 1
        },
        "command": {
         "remove": 1
        },
        "comment": {
         "remove": 1
        },
        "datalist": {
         "rename_tag": "span"
        },
        "dd": {
         "rename_tag": "div"
        },
        "del": {
         "remove": 1
        },
        "details": {
         "rename_tag": "div"
        },
        "device": {
         "remove": 1
        },
        "dfn": {
         "rename_tag": "span"
        },
        "dir": {
         "rename_tag": "ul"
        },
        "div": {
         "add_class": {
          "align": "align_text"
         }
        },
        "dl": {
         "rename_tag": "div"
        },
        "dt": {
         "rename_tag": "span"
        },
        "em": {},
        "embed": {
         "remove": 1
        },
        "fieldset": {
         "rename_tag": "div"
        },
        "figcaption": {
         "rename_tag": "div"
        },
        "figure": {
         "rename_tag": "div"
        },
        "font": {
         "add_class": {
          "size": "size_font"
         },
         "rename_tag": "span"
        },
        "footer": {
         "rename_tag": "div"
        },
        "form": {
         "rename_tag": "div"
        },
        "frame": {
         "remove": 1
        },
        "frameset": {
         "remove": 1
        },
        "h1": {
         "add_class": {
          "align": "align_text"
         }
        },
        "h2": {
         "add_class": {
          "align": "align_text"
         }
        },
        "h3": {
         "add_class": {
          "align": "align_text"
         }
        },
        "h4": {
         "add_class": {
          "align": "align_text"
         }
        },
        "h5": {
         "add_class": {
          "align": "align_text"
         }
        },
        "h6": {
         "add_class": {
          "align": "align_text"
         }
        },
        "head": {
         "remove": 1
        },
        "header": {
         "rename_tag": "div"
        },
        "hgroup": {
         "rename_tag": "div"
        },
        "hr": {},
        "html": {
         "rename_tag": "div"
        },
        "i": {},
        "iframe": {
         "remove": 1
        },
        "img": {
         "add_class": {
          "align": "align_img"
         },
         "check_attributes": {
          "alt": "alt",
          "height": "numbers",
          "src": "url",
          "width": "numbers"
         }
        },
        "input": {
         "remove": 1
        },
        "ins": {
         "rename_tag": "span"
        },
        "isindex": {
         "remove": 1
        },
        "kbd": {
         "rename_tag": "span"
        },
        "keygen": {
         "remove": 1
        },
        "label": {
         "rename_tag": "span"
        },
        "legend": {
         "rename_tag": "span"
        },
        "li": {},
        "link": {
         "remove": 1
        },
        "listing": {
         "rename_tag": "div"
        },
        "map": {
         "rename_tag": "div"
        },
        "mark": {
         "rename_tag": "span"
        },
        "marquee": {
         "rename_tag": "span"
        },
        "menu": {
         "rename_tag": "ul"
        },
        "meta": {
         "remove": 1
        },
        "meter": {
         "rename_tag": "span"
        },
        "multicol": {
         "rename_tag": "div"
        },
        "nav": {
         "rename_tag": "div"
        },
        "nextid": {
         "remove": 1
        },
        "nobr": {
         "rename_tag": "span"
        },
        "noembed": {
         "remove": 1
        },
        "noframes": {
         "remove": 1
        },
        "noscript": {
         "remove": 1
        },
        "object": {
         "remove": 1
        },
        "ol": {},
        "optgroup": {
         "rename_tag": "span"
        },
        "option": {
         "rename_tag": "span"
        },
        "output": {
         "rename_tag": "span"
        },
        "p": {
         "add_class": {
          "align": "align_text"
         }
        },
        "param": {
         "remove": 1
        },
        "plaintext": {
         "rename_tag": "span"
        },
        "pre": {},
        "progress": {
         "rename_tag": "span"
        },
        "q": {
         "check_attributes": {
          "cite": "url"
         }
        },
        "rb": {
         "rename_tag": "span"
        },
        "rp": {
         "rename_tag": "span"
        },
        "rt": {
         "rename_tag": "span"
        },
        "ruby": {
         "rename_tag": "span"
        },
        "s": {
         "rename_tag": "span"
        },
        "samp": {
         "rename_tag": "span"
        },
        "script": {
         "remove": 1
        },
        "section": {
         "rename_tag": "div"
        },
        "select": {
         "rename_tag": "span"
        },
        "small": {
         "rename_tag": "span",
         "set_class": "wysiwyg-font-size-smaller"
        },
        "source": {
         "remove": 1
        },
        "spacer": {
         "remove": 1
        },
        "span": {},
        "strike": {
         "remove": 1
        },
        "strong": {},
        "style": {
         "remove": 1
        },
        "sub": {
         "rename_tag": "span"
        },
        "summary": {
         "rename_tag": "span"
        },
        "sup": {
         "rename_tag": "span"
        },
        "svg": {
         "remove": 1
        },
        "table": {},
        "tbody": {
         "add_class": {
          "align": "align_text"
         }
        },
        "td": {
         "add_class": {
          "align": "align_text"
         },
         "check_attributes": {
          "colspan": "numbers",
          "rowspan": "numbers"
         }
        },
        "textarea": {
         "rename_tag": "span"
        },
        "tfoot": {
         "add_class": {
          "align": "align_text"
         }
        },
        "th": {
         "add_class": {
          "align": "align_text"
         },
         "check_attributes": {
          "colspan": "numbers",
          "rowspan": "numbers"
         }
        },
        "thead": {
         "add_class": {
          "align": "align_text"
         }
        },
        "time": {
         "rename_tag": "span"
        },
        "title": {
         "remove": 1
        },
        "tr": {
         "add_class": {
          "align": "align_text"
         }
        },
        "track": {
         "remove": 1
        },
        "tt": {
         "rename_tag": "span"
        },
        "u": {},
        "ul": {},
        "var": {
         "rename_tag": "span"
        },
        "video": {
         "remove": 1
        },
        "wbr": {
         "remove": 1
        },
        "xml": {
         "remove": 1
        },
        "xmp": {
         "rename_tag": "span"
        }
       }
      },
      locale: 'en',
      shortcuts: {
        '83': 'small',// S
        '75': 'createLink'// K
      }
    };

    if (typeof $.fn.wysihtml5.defaultOptionsCache === 'undefined') {
      $.fn.wysihtml5.defaultOptionsCache = $.extend(true, {}, $.fn.wysihtml5.defaultOptions);
    }

    var locale = $.fn.wysihtml5.locale = {};
  };
  bsWysihtml5($, wysihtml5);
}));
