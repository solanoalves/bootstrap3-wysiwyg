/**
 * Brazilian portuguese translation for bootstrap-wysihtml5
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('bootstrap.wysihtml5.pt-BR', ['jquery', 'bootstrap.wysihtml5'], factory);
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function($){
    $.fn.wysihtml5.locale["pt-BR"] = {
        font_size: {
          x8: "8 pt",
          x9: "9 pt",
          x10: "10 pt",
          x11: "11 pt",
          x12: "12 pt",
          x13: "13 pt",
          x14: "14 pt",
          x15: "15 pt",
          x16: "16 pt",
          x17: "17 pt",
          x18: "18 pt",
          x19: "19 pt",
          x20: "20 pt",
          x21: "21 pt",
          x22: "22 pt",
          x23: "23 pt",
          x24: "24 pt"
        },
        font_styles: {
            normal: "Normal",
            h1: "Título 1",
            h2: "Título 2",
            h3: "Título 3",
            h4: "Título 4",
            h5: "Título 5",
            h6: "Título 6"
        },
        emphasis: {
            bold: "Negrito",
            italic: "Itálico",
            underline: "Sublinhado",
            small: "Pequeno"
        },
        lists: {
            centerAlign: 'Centralizar',
            leftAlign: 'Alinhar à esquerda',
            rightAlign: 'Alinhar à direita',
            justifyAlign: 'Justificar',
            unordered: "Lista",
            ordered: "Lista numerada",
            outdent: "Remover indentação",
            indent: "Indentar"
        },
        link: {
            insert: "Inserir link",
            cancel: "Cancelar",
            target: "Abrir link em um nova janela"
        },
        image: {
            insert: "Inserir imagem",
            cancel: "Cancelar"
        },
        html: {
            edit: "Editar HTML"
        },
        colours: {
            black: "Preto",
            silver: "Prata",
            gray: "Cinza",
            maroon: "Marrom",
            red: "Vermelho",
            purple: "Roxo",
            green: "Verde",
            olive: "Oliva",
            navy: "Marinho",
            blue: "Azul",
            orange: "Laranja"
        }
    };
}));
