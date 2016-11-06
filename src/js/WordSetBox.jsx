export default class {
    constructor(wordSets, container) {
        var that = this;

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

        for (var i in wordSets) {
            var li = $('<li>');
            $('<a class="word-set" href="#">')
                .text(wordSets[i].name)
                .data('word-set', wordSets[i].text)
                .data('shuffle', wordSets[i].shuffle === true)
                .data('limit', wordSets[i].limit)
                .appendTo(li);
            li.appendTo(container);
        }

        container.find('a.word-set').on('click', function() {
            var wordList = $(this).data('word-set');

            if ($(this).data('shuffle') === true) {
                wordList = shuffle(wordList.split(' ')).join(' ');
            }

            var limit = $(this).data('limit');
            if (limit > 0) {
                wordList = wordList.split(' ').slice(0, limit).join(' ');
            }

            $(that).trigger({
                type: 'wordlistchange.wpm',
                name: $(this).text(),
                wordList: wordList,
            });

            container.find('li a.active').removeClass('active');
            $(this).addClass('active').blur();
            return false;
        });
    }
}
