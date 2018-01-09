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
       "classes": "any",
       "classes_blacklist": {
        "Apple-interchange-newline": 1,
        "MsoNormal": 1,
        "MsoPlainText": 1
       },
       "comments": 1,
       "tags": {
        "a": {
         "check_attributes": {
          "href": "url"
         },
         "set_attributes": {
          "rel": "nofollow",
          "target": "_blank"
         }
        },
        "div": {
            "one_of_type": {
                "alignment_object": 1
            },
            "remove_action": "unwrap",
            "keep_styles": {
                "textAlign": 1,
                "float": 1
            },
            "add_style": {
                "align": "align_text"
            },
            "check_attributes": {
                "id": "any",
                "contenteditable": "any"
            }
        },
        "b": {},
        "br": {},
        "em": {},
        "i": {},
        "u": {},
        "li": {},
        "ol": {},
        "p": {},
        "span": {},
        "strong": {},
        "ul": {}
      },
       "type_definitions": {
        "alignment_object": {
         "classes": {
          "wysiwyg-float-left": 1,
          "wysiwyg-float-right": 1,
          "wysiwyg-text-align-center": 1,
          "wysiwyg-text-align-justify": 1,
          "wysiwyg-text-align-left": 1,
          "wysiwyg-text-align-right": 1
         },
         "styles": {
          "float": [
           "left",
           "right"
          ],
          "text-align": [
           "left",
           "right",
           "center"
          ]
         }
        },
        "text_color_object": {
         "styles": {
          "background-color": true,
          "color": true
         }
        },
        "text_fontsize_object": {
         "styles": {
          "font-size": true
         }
        },
        "text_formatting_object": {
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
          }
        },
        "valid_image_src": {
         "attrs": {
          "src": {}
         }
        }
       }
      },
      locale: 'pt-BR',
      shortcuts: {
        '83': 'small',// S
        '75': 'createLink'// K
      }
    };

    (function(w5) {
    // Paste cleanup rules universal for all rules (also applied to content copied from editor)
    var commonRules = w5.lang.object(defaultOptions.parserRules).clone(true);
    commonRules.comments    = false;
    commonRules.selectors   = { "a u": "unwrap"};
    commonRules.tags.style  = { "remove": 1 };
    commonRules.tags.script = { "remove": 1 };
    commonRules.tags.head = { "remove": 1 };

    // Paste cleanup for unindentified source
    var universalRules = w5.lang.object(commonRules).clone(true);
    universalRules.tags.div.one_of_type.alignment_object = 1;
    universalRules.tags.div.remove_action = "unwrap";
    universalRules.tags.div.check_attributes.style = false;
    universalRules.tags.div.keep_styles = {
        "textAlign": /^((left)|(right)|(center)|(justify))$/i,
        "float": 1
    };
    universalRules.tags.span.keep_styles = false;

    // Paste cleanup for MS Office
    // TODO: should be extended to stricter ruleset, as current set will probably not cover all Office bizarreness
    var msOfficeRules = w5.lang.object(universalRules).clone(true);
    msOfficeRules.classes = {};

    defaultOptions.pasteParserRulesets = [
        {
            condition: /<font face="Times New Roman"|class="?Mso|style="[^"]*\bmso-|style='[^'']*\bmso-|w:WordDocument|class="OutlineElement|id="?docs\-internal\-guid\-/i,
            set: msOfficeRules
        },{
            condition: /<meta name="copied-from" content="wysihtml5">/i,
            set: commonRules
        },{
            set: universalRules
        }
    ];

  })(wysihtml5);

    if (typeof $.fn.wysihtml5.defaultOptionsCache === 'undefined') {
      $.fn.wysihtml5.defaultOptionsCache = $.extend(true, {}, $.fn.wysihtml5.defaultOptions);
    }

    var locale = $.fn.wysihtml5.locale = {};
  };
  bsWysihtml5($, wysihtml5);
}));
