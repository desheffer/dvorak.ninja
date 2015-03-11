(function($) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.ParagraphSelector = function(paragraphs, container, controller) {
        function shuffle(arr) {
            var temp, j, i = arr.length;
            while (--i) {
                j = ~~(Math.random() * (i + 1));
                temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }

            return arr;
        }

        for (var i in paragraphs) {
            var li = $('<li>');
            $('<a class="paragraph" href="#">')
                .text(paragraphs[i].name)
                .data('paragraph', paragraphs[i].text)
                .data('shuffle', paragraphs[i].shuffle === true)
                .appendTo(li);
            li.appendTo(container);
        }

        container.find('a.paragraph').on('click', function() {
            var paragraph = $(this).data('paragraph');
            if ($(this).data('shuffle') === true) {
                paragraph = shuffle(paragraph.split(' ')).join(' ');
            }

            controller.start(paragraph, 3);

            container.find('li a.active').removeClass('active');
            $(this).addClass('active').blur();
            return false;
        });
    };
})($);
