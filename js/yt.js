/**
 * @filename yt.js
 * @author Mike Wescott [wescott@cs.stanford.edu | mwescott@stanford.edu]
 * @requires jQuery 1.6.2+ 
 * @TODO: Implement Pub/Sub for quiz adds/deletes
 */
var CW = {};
CW.VideoApp = function () {

    var _translateTime = function (time) {

        var scrubberMax = CW.VideoApp.scrubber.slider('option','max');
        var scrubberWidth = parseInt($('#cwplayer').css('width')) - 2;

        var trueStep = scrubberWidth / scrubberMax;
        var trueMarkVal = time * trueStep;

        return trueMarkVal;
    };

    return {

        POLL_CALLS: 0,

        POLL_INTERVAL_ID: -1,

        POLL_INTERVAL_CLEARED: false,

        CW_PLAYER_DIV_ID: 'cwplayer',

        quizMarkers: [],

        parseVideoTime: function (currentTime) {

            var curMin = Math.floor(currentTime / 60);
            var curSec = Math.floor(currentTime % 60);
            var fmtCurSec = (curSec >= 10) ? curSec : ('0' + curSec);

            return curMin + ':' + fmtCurSec;

        },

        createPlayer: function (ytVideoId) {
        
            // instantiate Cw.VideoApp.cwplayer with YT.Player constructor 
            CW.VideoApp.cwplayer = new YT.Player(CW.VideoApp.CW_PLAYER_DIV_ID, {
                height: '480',
                width: '800',
                videoId: ytVideoId,
                playerVars: { 'controls': 0, 'wmode': 'transparent', 'fs': 0 },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange,
                    'onError': onPlayerError
                }
            });

        },

        initPlayerControls: function () {
        
            // initialize the polling interval status
            CW.VideoApp.POLL_INTERVAL_CLEARED = false;

            // add click listener for Play link
            $('#play-video').click(function (ev) {

                CW.VideoApp.cwplayer.playVideo();

                $('#cwplayer-scrubber').slider('option', 'value', CW.VideoApp.cwplayer.getCurrentTime());

                if (CW.VideoApp.POLL_INTERVAL_CLEARED) {
                    CW.VideoApp.POLL_INTERVAL_ID = setInterval(CW.VideoApp.updateSlider, 200);
                }

            });

            // add click listener for the Pause link
            $('#pause-video').click(function (ev) {

                CW.VideoApp.cwplayer.pauseVideo();

                clearInterval(CW.VideoApp.POLL_INTERVAL_ID); 
                CW.VideoApp.POLL_INTERVAL_CLEARED = true;

            });

            // initialize the jQuery slider and add stop handler
            CW.VideoApp.scrubber = $('#cwplayer-scrubber').slider({
                start: function (ev, ui) {
                    $('#pause-video').click();
                },
                stop: function (ev, ui) {
                    if (CW.VideoApp.cwplayer) {
                        CW.VideoApp.cwplayer.seekTo(ui.value, true);
                    }
                },
            });
        },

        initQuizMarkers: function (mapObj) {

            for (questionId in mapObj) {
                CW.VideoApp.addQuizMarker(parseInt(questionId));
            }

        },

        addQuizMarker: function (time) {

            var correctedTime = -1;

            if (!parseInt(time)) {
                // get value directly from scrubber
                time = Math.floor(CW.VideoApp.scrubber.slider('option','value'));
            }

            correctedTime = _translateTime(time);

            // use argument passed in
            $('#cwplayer-scrubber').append('<div id="quiz-marker-' + time + '" class="quiz-marker"></div>');

            var markerStyles = {
                'position': 'absolute',
                'background-color': '#f00',
                'height': '11px',
                'width': '2px',
                'left': correctedTime
            };

            $('#quiz-marker-' + time).css(markerStyles);

            CW.VideoApp.quizMarkers.push(time);

            correctedTime = markerStyles = null;

        },

        removeQuizMarker: function (markerId) {
            var markerIndex = CW.VideoApp.quizMarkers.indexOf(markerId);
            if (markerIndex !== -1) {
                $('#quiz-marker-' + markerId).remove();
                CW.VideoApp.quizMarkers.splice(markerIndex, 1);
            }
        },

        updateSlider: function () {

            // get current video time
            var curTime = CW.VideoApp.parseVideoTime(CW.VideoApp.cwplayer.getCurrentTime());

            // give slider a value
            $('#cwplayer-scrubber').slider('option', 'value', CW.VideoApp.cwplayer.getCurrentTime());

            // also update running time display
            $('#runtime').get(0).innerHTML = (curTime);

            // keep track of how many polling calls there are
            CW.VideoApp.POLL_CALLS += 1;
        },
        
        initPlayerReady: function (event) {

            CW.VideoApp.initPlayerControls();

            var videoTotalTime = CW.VideoApp.parseVideoTime(CW.VideoApp.cwplayer.getDuration());

            $('#cwplayer-scrubber').slider('option', 'max', CW.VideoApp.cwplayer.getDuration());

            $('#cwplayer-footer').append(videoTotalTime); 
            $('#cwplayer-footer').show('slow');

            CW.VideoApp.POLL_CALLS = 0;

        },

        handlePlayerStateChange: function (event) {

            if (event.data == YT.PlayerState.PLAYING) {

                CW.VideoApp.POLL_INTERVAL_ID = setInterval(CW.VideoApp.updateSlider, 200);

            } else {

                clearInterval(CW.VideoApp.POLL_INTERVAL_ID);
                CW.VideoApp.POLL_INTERVAL_CLEARED = true;

            }

        }

    };  // end returned object

}();  // end VideoApp function definition

// dynamic script tag hack to load the IFrame Player API code 
// asynchronously [YouTube]
var tag = document.createElement('script');
tag.src = "http://www.youtube.com/player_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// create an <iframe> (and YouTube player) after the API code downloads
// {global}
function onYouTubePlayerAPIReady() {
    CW.VideoApp.ytVideoId = $('#vidID').val() || $('#yt_videoID').val() || '0R3uYd1cz20';
    CW.VideoApp.createPlayer(CW.VideoApp.ytVideoId);
}


// The API calls this function when the player's state changes.
// {global}
function onPlayerStateChange(event) {
    CW.VideoApp.handlePlayerStateChange(event);
}

// {global}
function stopVideo() {
    CW.VideoApp.cwplayer.stopVideo();
}
