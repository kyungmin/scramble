if (Meteor.isClient) {
  Session.setDefault("answer", "");
  Session.setDefault("scrambledWord", "");
  Session.setDefault('points', 0);
  Session.setDefault('currentIndex', 0);
  Session.setDefault('message', '?');

  $('body').on('touchstart', function () {
    $("input").focus();
  });

  getWord();

  $(window).on('keydown', function(e) {
    var input = String.fromCharCode(e.which).toLowerCase();
    var points = Session.get('points');
    var answer = Session.get('answer');
    var scrambledWord = Session.get('scrambledWord');
    var currentIndex = Session.get('currentIndex');
    var matchedIndex = scrambledWord.slice(currentIndex).indexOf(input);

    // rearrange word
    if (matchedIndex >= 0) {
      var matchedStr = scrambledWord.slice(0, currentIndex) + input;
      var first = scrambledWord.slice(currentIndex, currentIndex + matchedIndex);
      var second = scrambledWord.slice(currentIndex + matchedIndex + 1);
      var newStr = matchedStr.concat(first, second);

      Session.set('currentIndex', currentIndex + 1);
      Session.set('scrambledWord', newStr);
    }

    // determine win or lost
    if (currentIndex === answer.length - 1) {
      if (scrambledWord === answer) {
        Session.set('points', points + answer.length);
        $(".letter").addClass("correct");
        $(".points").addClass("animate");

        setTimeout(function() {
          $(".points").removeClass("animate");
          $(".letter").removeClass("correct");
          getWord();
        }, 400);
      } else {
        $(".letter").addClass("incorrect");
        $(".message.status").hide();
        $(".message.fail").show();

        setTimeout(function() {
          Session.set('currentIndex', 0);
          $(".letter").removeClass("incorrect");
          $(".message.status").show();
          $(".message.fail").hide();
          $('input').val('');
        }, 300);
      }

    }
  });

  function getWord() {
    Session.set('currentIndex', 0);

    Meteor.call("getWord", function(error, results) {

      if (results) {
        var answer = results.data.word.toLowerCase();
        var chars = answer.split('');
        var scrambledWord = _.shuffle(chars).join('');
        console.log("answer:", answer);

        Session.set("answer", answer);
        Session.set("scrambledWord", scrambledWord);

      } else {
        console.log(error);
      }
    });
  }

  function renderWord() {
    var scrambledWord = Session.get('scrambledWord');
    var currentIndex = Session.get('currentIndex');
    var html = '';

    scrambledWord.split('').forEach(function(letter, index) {
      var color = (index < currentIndex) ? 'matched' : 'unmatched';
      var letter = '<span class="letter ' + color + '">' + letter + '</span>';
      html += letter;
    });

    $(".words").html(html);
  }

  Template.scramble.helpers({
    letters: function () {
      var currentIndex = Session.get('currentIndex');
      var letters = [];

      Session.get('scrambledWord').split('').forEach(function(letter, index) {
        var color = (index < currentIndex) ? 'matched' : 'unmatched';

        letters.push({
          letter: letter,
          color: color
        });
      });

      return letters;
    },

    points: function () {
      return Session.get('points');
    }
  });

  Template.ga.helpers({
    gaKey: function () {
      return Meteor.settings.public.ga.account;
    }
  });

  Template.scramble.events({
    'click .reset': function () {
      getWord();
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.methods({
      getWord: function () {
        this.unblock();

        var url = "http://api.wordnik.com:80/v4/words.json/randomWord?hasDictionaryDef=false&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=4&maxLength=5&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";

        return Meteor.http.call("GET", url);
      }
    });
  });
}
