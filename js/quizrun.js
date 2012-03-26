/**
 * @filename quizrun.js
 * @authors Jason Bau [jbau], David Adams [dcadams], Mike Wescott [mwescott]
 * requires yt.js, jQuery 1.6.2+
 * @TODO: Implement Pub/Sub
 */

CW.VideoApp.QuizRun = function () {

    return {

        questions: {},

        recordMe: null,

        skipSec: -1,

        elgg_course_guid: $('#course_guid').val(),

        runQuiz: function () {

            var dataObj = {};
            dataObj.vidID = $('#yt_videoID').val();
            dataObj.action = 'getYTQuestions';
            dataObj.course_guid = $('#course_guid').val();
            
            $.ajax({

                url: elgg.config.wwwroot + "mod/courses/pages/getYTQuestions.php",

                dataType: 'json',

                data: dataObj, 

                cache: false,

                error: function(a,b,c) {
                    alert('An error occurred while connecting with the question storage server.');
                },

                success: function(data) {

                    CW.VideoApp.QuizRun.questions = data;

                    for (j in CW.VideoApp.QuizRun.questions) {
                        CW.VideoApp.QuizRun.questions[j].done = false;
                    }

                    CW.VideoApp.QuizRun.mods = document.getElementsByClassName('quizModule');

                    for (i = 0; i < CW.VideoApp.QuizRun.mods.length; i++) {
                        CW.VideoApp.QuizRun.mods[i].style.display='inline';
                    }
                    
                    //createPlayer(yt_videoID);
                    //document.getElementById('startmsg').style.display='none';
                }
             });

        },

        setupQPane: function (qTime) {

            var curQ = CW.VideoApp.QuizRun.questions[qTime];

            if(curQ.qType=="m-c") {
                typeString = "Multiple-choice.  Please check ALL possible correct choices.";
            } else {
                typeString = "Please answer the following question:";
            }
            
            /*
            var bgDiv = document.createElement('div');
            bgDiv.setAttribute('id', 'questionBG');
            $('#cwplayer').after(bgDiv);
            */
            $('#cwplayer').after('<div id="questionBG"></div>');

            /*
            var qDiv = document.createElement('div');
            qDiv.setAttribute('class','questionDiv');
            qDiv.setAttribute('id','questionPane');
            $('#questionBG').after(qDiv);
            */
            $('#questionBG').after('<div id="questionPane" class="questionDiv"></div>');

            timelabel = timeDisplay(qTime);
            //var qInst = document.getElementById('qInst');
            var qInst = $('#qInst');

            if (curQ.qType == "m-c") {
                //qInst.innerHTML='<div id="dNd" class="bottomAlign"><h4>'+typeString+'</h4></div>';
                $('#qInst').append('<div id="dNd" class="bottomAlign"><h4>'+typeString+'</h4></div>');

                //qDiv.innerHTML='<div id="qaSpace"><textarea readonly="readonly" id="questionText" rows="2"></textarea></div>';
                $('#questionBG').append('<div id="qaSpace"><textarea readonly="readonly" id="questionText" rows="2"></textarea></div>');

                CW.VideoApp.QuizRun.addChoices(curQ);

            } else { //Short answer

                //qInst.innerHTML='<div id="dNd" class="bottomAlign"><h4>'+typeString+'</h4></div>';
                $('#qInst').append('<div id="dNd" class="bottomAlign"><h4>'+typeString+'</h4></div>');

                //qDiv.innerHTML='<div id="qaSpace"><textarea readonly="readonly" id="questionText" rows="3"></textarea><br /></div><div id="saSpace"><br /><textarea id="answerTemplate" row="2" placeholder="Answer"></textarea><br /></div>';
                $('questionBG').append('<div id="qaSpace"><textarea readonly="readonly" id="questionText" rows="3"></textarea><br /></div><div id="saSpace"><br /><textarea id="answerTemplate" row="2" placeholder="Answer"></textarea><br /></div>');

            }

            $('#questionText').val(curQ.qText);    

            if (curQ.qText=="") {
                $('#questionText').hide();
            }

            //Setup Submit / Skip Buttons
            var buttonDiv = document.createElement('div');
            buttonDiv.setAttribute('id','buttonDiv');
            buttonDiv.setAttribute('class','bottomAlign');
            buttonDiv.style.height='0px';
            buttonDiv.style.width='160px';
            buttonDiv.innerHTML = "<input type='button' onclick='CW.VideoApp.QuizRun.submitAns("+qTime+")' value='Submit' class='elgg-button elgg-button-submit' /> <input type='button' onclick='CW.VideoApp.QuizRun.skipQ()' value='Skip' class='elgg-button elgg-button-submit' /><br /><img style='opacity:0' src='drag_arrow_icon.png' />";
            $('#questionPane').append(buttonDiv);    
            $("button").button();

            //Position and color everything
            $("#questionBG").css('opacity',curQ.bgOpacity);
            $('#questionPane').css('color',curQ.fontColor);
            $('#questionPane textarea').css('color',curQ.fontColor);

            $('#qaSpace').css('position','absolute');
            $('#qaSpace').css('left',curQ.qPos.left);
            $('#qaSpace').css('top',curQ.qPos.top);
            $('#questionText').css('width',curQ.qPos.width);
            $('#questionText').css('height',curQ.qPos.height);
            
            $('#buttonDiv').css('position','absolute');
            $('#buttonDiv').css('left',curQ.buttonPos.left);
            $('#buttonDiv').css('top',curQ.buttonPos.top);
            
            if(curQ.qType=="s-a") {
                $('#saSpace').css('position','absolute');
                $('#saSpace').css('left',curQ.aPos.left);
                $('#saSpace').css('top',curQ.aPos.top);
                $('#answerTemplate').css('width',curQ.aPos.width);
                $('#answerTemplate').css('height',curQ.aPos.height);
                $('#answerTemplate')[0].focus();
            } 
        }, // END setupQPane

        addChoices: function (curQ) {
            var i = 1;
            for (j in curQ.answers) {
                var qTable = document.createElement('table')
                qTable.setAttribute('id','choice'+i);
                qTable.setAttribute('class','qChoice');
                document.getElementById('questionPane').appendChild(qTable);

                var tr = document.createElement('tr');
                tr.setAttribute('class','qTableRow');
                tr.setAttribute("id","ansID" + i);
                tr.innerHTML='<td class="qTableCheck"><input id="check'+i+'" type="checkbox" /><label class="checkButton"  id="label'+i+'"  for="check'+i+'"></label></td><td id="textCell'+i+'" class="qTableAns"><textarea class="mcAns"  rows="2" readonly="readonly" id="ansText'+i+'"></textarea></td></tr>';
                qTable.appendChild(tr);


                $(qTable).css("left",curQ.answers[j].tablePos.left);
                $(qTable).css("top",curQ.answers[j].tablePos.top);

                $("#ansText"+i).css("height",curQ.answers[j].aSize.height);
                $("#ansText"+i).css("width",curQ.answers[j].aSize.width);

                $("#check"+i)[0].checked=false;
                $("#check"+i).button({text:false, icons: {primary: "ui-icon-blank"}, label:"Check if choice is correct"});	

                //Handle the toggling graphics (showing check or not)
                $("#check"+i).change( function (evt) {CW.VideoApp.QuizRun.showCorrect(evt.target);});

                document.getElementById('ansText'+i).value=curQ.answers[j].text;
                if (curQ.answers[j].text==""){
                    document.getElementById('ansText'+i).style.opacity=0;
                }
                i+=1;
            }
        },
        // END addChoices

        skipQ: function (){
            CW.VideoApp.QuizRun.closeQPane();
            CW.VideoApp.cwplayer.playVideo();
        },

        closeQPane: function () {
            document.getElementById('qInst').innerHTML="";
            $("div#questionPane").remove();
            $("div#questionBG").remove();
        },

        showCorrect: function (input) {
            if (input.checked) {
                $(input).button('option','icons', {primary: "ui-icon-check"});
            } else { 
                $(input).button('option','icons', {primary: "ui-icon-blank"});
            }
        },

        submitAns: function (qTime) {
            var curQ = CW.VideoApp.QuizRun.questions[qTime];
            var allcorrect;
            var studentVal;
            
            course_guid = document.getElementById('course_guid').value.trim();
            yt_videoID = document.getElementById('yt_videoID').value.trim();
            user_guid = document.getElementById('user_guid').value.trim();
            chunk_guid = document.getElementById('chunk_guid').value.trim();
            
            
            if (curQ.qType == "m-c") {
                allcorrect=true;
                for (j in curQ.answers) {
                    if((document.getElementById('check'+j).checked && !curQ.answers[j].correct) ||
                            (!document.getElementById('check'+j).checked && curQ.answers[j].correct)) {
                        allcorrect = false;
                        break;
                    }
                }
                for (j in curQ.answers) {
                    if (document.getElementById('check'+j).checked) {
                        if (studentVal) {
                            studentVal += ':' + j;
                        }else {
                            studentVal = j;
                        }
                    }
                }
            }
            else { // sa
            allcorrect=false;
            studentVal = document.getElementById('answerTemplate').value.trim();
            if (!curQ.isRegexp && studentVal.toLowerCase() == curQ.aText.trim().toLowerCase())
                allcorrect = true;
            if (curQ.isRegexp){
                var patt = /^\u002F.*\u002F/;  //A regex to match the string representation of a regex form
                try{
                var pattern = patt.exec(curQ.aText)[0]; //get the pattern including the slashes
                var modifiers = curQ.aText.slice(pattern.length);
                var regex = new RegExp(pattern.slice(1,-1),modifiers);
                if (regex.test(studentVal))
                    allcorrect = true;
                } 
                catch (e) {
                allcorrect = false;
                }
            }
            }
            if (allcorrect) {
                $.ajax( {
                    type:'POST',
                    headers:{'X-Yquiz-Submit':'1'},
                    url: elgg.config.wwwroot + "mod/courses/pages/saveYTAnswers.php",
                    data:{vidID: yt_videoID,
                          action: 'saveYTAnswers',
                          course_guid: course_guid,
                          chunk_guid: chunk_guid,
                          user_guid: user_guid,
                          qtext: curQ.qText,
                          atext: studentVal,
                          correct: 'Y'},
                     statusCode: {
                            200:function(data,status) {
                            if (data!="Successfully saved answer data") {
        //        			    alert('Your session with WebAuth might have expired.  Opening a window for you to re-authenticate');
        //        			    window.open('reauth.php');
                            } else {
                                alert('Saved to server');
                            }
                            }
                        },
                    error: function(a,b,c) {
                       alert('An error occurred while connecting with the server.');
                    }
                     });
                $('#correct-dialog').dialog('open');
            } else {
                $.ajax( {
                    type:'POST',
                    headers:{'X-Yquiz-Submit':'1'},
                    url: elgg.config.wwwroot + "mod/courses/pages/saveYTAnswers.php",
                    data:{vidID: yt_videoID,
                          action: 'saveYTAnswers',
                          course_guid: course_guid,
                          chunk_guid: chunk_guid,
                          user_guid: user_guid,
                          qtext: curQ.qText,
                          atext: studentVal,
                          correct: 'N'},
                     statusCode: {
                            200:function(data,status) {
                            if (data!="Successfully saved answer data") {
        //        			    alert('Your session with WebAuth might have expired.  Opening a window for you to re-authenticate');
        //        			    window.open('reauth.php');
                            } else {
                                alert('Saved to server');
                            }
                            }
                        },
                    error: function(a,b,c) {
                       alert('An error occurred while connecting with the server.');
                    }
                     });
                $('#wrong-dialog').dialog('open');
            }
        },
        // END submitAns

        handlePlayerStateChange: function (event) {
            CW.VideoApp.handlePlayerStateChange(event);
            CW.VideoApp.QuizRun.recordMe = event;
            if (event.data == YT.PlayerState.PLAYING) { 
                setTimeout(CW.VideoApp.QuizRun.checkTime, 200);
            }
        },

        checkTime: function () {    // display quiz
            var curTime = Math.floor(CW.VideoApp.cwplayer.getCurrentTime());
            if (CW.VideoApp.QuizRun.questions.hasOwnProperty(curTime) && CW.VideoApp.QuizRun.skipSec!=curTime && 
                CW.VideoApp.cwplayer.getPlayerState() == YT.PlayerState.PLAYING) {
                CW.VideoApp.QuizRun.processQuiz(curTime);
            } else { 
                setTimeout(CW.VideoApp.QuizRun.checkTime, 200);
            }

            if (!CW.VideoApp.QuizRun.questions.hasOwnProperty(curTime)) {
                CW.VideoApp.QuizRun.skipSec=-1;
            }
        },

        processQuiz: function (curTime) {

            CW.VideoApp.cwplayer.pauseVideo();

            CW.VideoApp.QuizRun.skipSec = curTime;

            if (CW.VideoApp.QuizRun.questions.hasOwnProperty(curTime)) {

                CW.VideoApp.QuizRun.questions[curTime].done = true;
                CW.VideoApp.QuizRun.setupQPane(curTime);

            } else {

                CW.VideoApp.cwplayer.playVideo();

            }
        }

    };
}();

$(function() {
    $( "#correct-dialog" ).dialog({
	autoOpen:false,
	modal: false,
	buttons: {
	    "Continue Video": function() {
		$( this ).dialog( "close" );
		CW.VideoApp.QuizRun.closeQPane();
		CW.VideoApp.cwplayer.playVideo();
	    }
	}
    });
    $( "#wrong-dialog" ).dialog({
	autoOpen:false,
	modal: false,
	buttons: {
	    "OK": function() {
		$( this ).dialog( "close" );
		$('#answerTemplate')[0].focus();

	    }
	}
    });
    $("input:submit").button();
});

/*
var player;
function onYouTubePlayerAPIReady() {
    document.getElementById('startmsg').style.display='block';
    runQuiz();
}
function createPlayer(vid) {
	player = new YT.Player('player', {
      height: '480',
      width: '800',
      videoId: vid,
//  wmode: transparent  makes HTML goes on top of Flash
//  fs: disable full screen
      playerVars: {'autoplay': 1, 'wmode': 'transparent', 'fs': 0},
      events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange,
          'onError': onPlayerError,
	  'onSeek': onPlayerSeek
      }
  });
  document.getElementById('player').style['z-index']=0;
  
}
*/

function timeDisplay(timeInSec) {
    var min = Math.floor(timeInSec/60);
    var sec = timeInSec - 60*min;
    if (sec<10) sec = '0'+sec;
    return ("" + min + ":" + sec);
}

function onPlayerReady(event) {

    // initializes scrubber in yt.js
    CW.VideoApp.initPlayerReady(event);

    CW.VideoApp.QuizRun.runQuiz();
    //event.target.playVideo(); 
}

function onPlayerError(event) {
    alert('error');
}

function onPlayerSeek(event) {
    alert('seek!');
}

function onPlayerStateChange(event) {
    CW.VideoApp.QuizRun.handlePlayerStateChange(event);
}

$(document).ready(function () {
    $('.quizModule').show();
});
