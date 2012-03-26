/**
 * @filename quizgen.js
 * @authors Jason Bau [jbau], David Adams [dcadams], Mike Wescott [mwescott]
 * @requires yt.js, jQuery 1.6.2+
 * @TODO: Implement Pub/Sub for quiz adds/deletes
 */

CW.VideoApp.QuizGen = function () { 

    return {

        vidName: '',

        questions: {},

        firstAns: true,

        ansID: 0,

        elgg_course_guid: $('#course_guid').val(),

        prepareQuizModule: function (videoId) {

            var dataObj = {};
            dataObj.vidID = videoId;
            dataObj.action = 'getYTQuestions';
            dataObj.course_guid = $('#course_guid').val();

            $.ajax({

                url: elgg.config.wwwroot + "mod/courses/pages/getYTQuestions.php",

                dataType:'json',

                data: dataObj, 

                cache:false,

                error: function(a,b,c) {
                    alert('An error occurred while connecting with the question storage server.');
                },

                success: function(data) {

                    CW.VideoApp.QuizGen.questions = data;

                    CW.VideoApp.QuizGen.updateSelector();

                    //document.getElementById('jsonOutput').value=JSON.stringify(questions);    
                    $('#jsonOutput').val(JSON.stringify(CW.VideoApp.QuizGen.questions));    

                    // if there are questions, but no markers on the scrubber, add them all
                    if (!$.isEmptyObject(CW.VideoApp.QuizGen.questions) && 
                            CW.VideoApp.quizMarkers.length == 0) {
                        CW.VideoApp.initQuizMarkers(CW.VideoApp.QuizGen.questions);
                    }

                }

             });

        },

        loadQuestion: function (event, ui) {
            CW.VideoApp.QuizGen.closeQPane();

            var typeSel;
            var curQ = CW.VideoApp.QuizGen.questions[ui.selecting.title];

            if(curQ.qType == "m-c") {
                typeSel = 1
            } else {
                typeSel = 2
            }

            CW.VideoApp.QuizGen.setupQPane(typeSel, curQ.time);

            CW.VideoApp.cwplayer.seekTo(curQ.time, true);

            // Move scrubber handle to appropriate spot
            CW.VideoApp.scrubber.slider('option', 'value', curQ.time);

            CW.VideoApp.cwplayer.pauseVideo();
            
            //Write question text
            $('#questionText').val(curQ.qText);

            //Position Question box
            $('#qaSpace').css('left',curQ.qPos.left);
            $('#qaSpace').css('top',curQ.qPos.top);
            $('#questionText').css('width',curQ.qPos.width);
            $('#questionText').css('height',curQ.qPos.height);
            $('#questionText').resizable('widget').css('width',curQ.qPos.width);
            $('#questionText').resizable('widget').css('height',curQ.qPos.height);
            $('#buttonDiv').css('left',curQ.buttonPos.left);
            $('#buttonDiv').css('top',curQ.buttonPos.top);

            //Read saved answers
            if(curQ.qType=="m-c") {
                //Move multiple-choice box
                //Setup each choice
                for (j in curQ.answers) {

                    //Get saved choice
                    CW.VideoApp.QuizGen.addChoice();

                    $('#ansText'+ CW.VideoApp.QuizGen.ansID).val(curQ.answers[j].text);
                    $('#check'+ CW.VideoApp.QuizGen.ansID)[0].checked=curQ.answers[j].correct;

                    CW.VideoApp.QuizGen.showCorrect($('#check'+ CW.VideoApp.QuizGen.ansID)[0]);
                    
                    //Get right position for choice
                    $('#choice'+ CW.VideoApp.QuizGen.ansID).css('left',curQ.answers[j].tablePos.left);
                    $('#choice'+ CW.VideoApp.QuizGen.ansID).css('top',curQ.answers[j].tablePos.top);

                    //Get the right size for choice
                    $('#ansText'+ CW.VideoApp.QuizGen.ansID).css('width',curQ.answers[j].aSize.width);
                    $('#ansText'+ CW.VideoApp.QuizGen.ansID).css('height',curQ.answers[j].aSize.height);
                    $('#ansText'+ CW.VideoApp.QuizGen.ansID).resizable('widget').css('width',curQ.answers[j].aSize.width);
                    $('#ansText'+ CW.VideoApp.QuizGen.ansID).resizable('widget').css('height',curQ.answers[j].aSize.height);

                    CW.VideoApp.QuizGen.redrawTextareaWidget($('#ansText'+ CW.VideoApp.QuizGen.ansID)[0]);
                }
            } else {
                //Short answer
                //Get saved answer
                $('#answerTemplate').val(curQ.aText);
                $('#regexCheck').attr('checked', curQ.isRegexp);

                //Draw short answer box
                $('#saSpace').css('left',curQ.aPos.left);
                $('#saSpace').css('top',curQ.aPos.top);
                $('#answerTemplate').css('width',curQ.aPos.width);
                $('#answerTemplate').css('height',curQ.aPos.height);
                $('#answerTemplate').resizable('widget').css('width',curQ.aPos.width);
                $('#answerTemplate').resizable('widget').css('height',curQ.aPos.height);
            }

            //Color everything
            $("#questionBG").css('opacity',curQ.bgOpacity);
            $("#pane-trans-slider").slider('value',curQ.bgOpacity*100);
            $('#questionPane').css('color',curQ.fontColor);
            $('#questionPane textarea').css('color',curQ.fontColor);

            $.farbtastic("#colorPickerDiv").setColor(colorToHex(curQ.fontColor));

        },

        setupQPane: function (qType, qTime) {

            CW.VideoApp.QuizGen.firstAns = true;

            $("#pane-trans-slider").slider({
                orientation: "vertical",
                range: "min",
                min: 0,
                max: 100,
                value: 95,
                slide: function (event, ui) {
                    $("#questionBG").css('opacity', ui.value/100 );
                }
            });

            var colorpicker = document.createElement('div');
            colorpicker.setAttribute('id','colorPickerDiv');
            $(".content").append(colorpicker);

            $('#colorPickerDiv').farbtastic(function (color) {
                $('#questionPane').css('color', color);
                $('#questionPane textarea').css('color', color);
            });
           
            var bgDiv = document.createElement('div');
            bgDiv.setAttribute('id', 'questionBG');
            $('#playerdiv').append(bgDiv); 

            var qDiv = document.createElement('div');
            qDiv.setAttribute('class','questionDiv');
            qDiv.setAttribute('id','questionPane');
            $('#playerdiv').append(qDiv); 

            timelabel = timeDisplay(qTime);
            var qInst = document.getElementById('qInst');

            if (qType == 1 /*Multiple-choice*/) {

                qInst.innerHTML='<div id="dNd" class="bottomAlign"><h4>Multiple-choice at ' + timelabel + '  (Students must match your input on all choices.)</h4>You can drag and resize the text fields and buttons.</div>';
                qDiv.innerHTML='<div id="qaSpace"><textarea id="questionText" rows="2" placeholder="Question text"></textarea><br /></div>';	

            } else { 

                //Short-answer
                qInst.innerHTML='<div id="dNd" class="bottomAlign"><h4>Short-answer at ' + timelabel + '  (Students must match the answer you enter.)</h4>You can drag and resize the text fields and buttons.</div>';
                qDiv.innerHTML='<div id="qaSpace"><textarea id="questionText" placeholder="Question text"></textarea><br /></div><div id="saSpace"><br /><textarea id="answerTemplate"  placeholder="Answer"></textarea><div>Regexp?<input id="regexCheck" type=checkbox /><br /></div></div>';
                $("#answerTemplate").resizable({minHeight:25, minWidth:60});
                $("#saSpace").draggable();

            }

            $("#questionText").resizable({minHeight:25, minWidth:105});
            $("#qaSpace").draggable();

            var buttonDiv = document.createElement('div');
            buttonDiv.setAttribute('id','buttonDiv');
            buttonDiv.setAttribute('class','bottomAlign');
            qDiv.appendChild(buttonDiv);    

            if (qType == 1 /* MC */) {
                buttonDiv.innerHTML = '<input type="button" value="Add a choice" onclick="CW.VideoApp.QuizGen.addChoice()" class="elgg-button elgg-button-submit" /> <input type="button" value="Save" onclick="CW.VideoApp.QuizGen.saveMC('+qTime+')" class="elgg-button elgg-button-submit" /> <input type="button" value="Close" onclick="CW.VideoApp.QuizGen.closeQPane()" class="elgg-button elgg-button-submit" /> <input type="button" value="Delete Question" onclick="CW.VideoApp.QuizGen.delQ('+qTime+')" class="elgg-button elgg-button-submit" /><br /><img src="drag_arrow_icon.png" /><input id="qTimestamp" type=hidden value="'+qTime+'" />'; 
                buttonDiv.style.width='400px';
            } else { //SA
                buttonDiv.innerHTML = '<input type="button" value="Save" onclick="CW.VideoApp.QuizGen.saveSA('+qTime+')" class="elgg-button elgg-button-submit" /> <input type="button" value="Close" onclick="CW.VideoApp.QuizGen.closeQPane()" class="elgg-button elgg-button-submit" /> <input type="button" value="Delete Question" onclick="CW.VideoApp.QuizGen.delQ('+qTime+')" class="elgg-button elgg-button-submit" /><br /><img src="drag_arrow_icon.png" /><input id="qTimestamp" type="hidden" value="'+qTime+'" />'; 
                buttonDiv.style.width='400px';
            }

            $("button").button();
            $("#buttonDiv").draggable();

        },

        closeQPane: function () {

            $('#SAbutton').attr('disabled', false);
            $('#MCbutton').attr('disabled', false);
            
            $("div#questionPane").remove();
            $("div#questionBG").remove();

            $("#pane-trans-slider").slider("destroy");

            $("#colorPickerDiv").remove();

            $("#createButtons").css('display','block');
            $("#qInst")[0].innerHTML="";

        },

        addChoice: function () {
            CW.VideoApp.QuizGen.ansID += 1;

            var widths= $('.mcAns').map(function() {
                return $(this).width();
            }).get();


            var qTable = document.createElement('table');
            qTable.setAttribute('id','choice'+ CW.VideoApp.QuizGen.ansID);
            qTable.setAttribute('class','qChoice');

            var lastChoice = $(".qChoice").last();
            var qTableTop,qTableLeft;

            if (lastChoice.length==0){
                qTableTop=130;
                qTableLeft=20;
            } else {
                qTableTop = lastChoice.position().top+60;
                qTableLeft = lastChoice.position().left;

                if (qTableTop > 350){
                    qTableLeft += 400
                    qTableTop = 130;
                }
            }

            qTable.style.top = qTableTop + 'px';
            qTable.style.left = qTableLeft + 'px';

            document.getElementById('questionPane').appendChild(qTable);
            var tr = document.createElement('tr');
            tr.setAttribute('class','qTableRow');
            tr.setAttribute("id","ansID" + CW.VideoApp.QuizGen.ansID);

            tr.innerHTML='<td class="qTableCheck"><input id="check'+ CW.VideoApp.QuizGen.ansID +'" type="checkbox" /><label class="checkButton"  id="label'+ CW.VideoApp.QuizGen.ansID +'"  for="check' + CW.VideoApp.QuizGen.ansID +'"></label></td><td class="qTableAns" id="ansCell'+ CW.VideoApp.QuizGen.ansID +'"><textarea id="ansText' + CW.VideoApp.QuizGen.ansID +'" class="mcAns" rows="2" placeHolder="Choice text"></textarea></td><td class="qTableDel"><button id="del'+ CW.VideoApp.QuizGen.ansID +'" onclick="CW.VideoApp.QuizGen.ansDel('+ CW.VideoApp.QuizGen.ansID +')">Delete this choice</button></td></tr>';
            qTable.appendChild(tr);


            //qTable.innerHTML+='<img class="moveUp" src="drag_arrow_icon.png" />';
            $(qTable).draggable({grid:[10,10]});

            //Have first answer of pane appear as checked, rest not.
            if (CW.VideoApp.QuizGen.firstAns) {
                CW.VideoApp.QuizGen.firstAns = false;
                $("#check"+ CW.VideoApp.QuizGen.ansID)[0].checked=true;
                $("#check"+ CW.VideoApp.QuizGen.ansID).button({text:false, icons: {primary: "ui-icon-check"}, label:"Set the answer key"});
            }
            else {
                $("#check"+ CW.VideoApp.QuizGen.ansID)[0].checked=false;
                $("#check"+ CW.VideoApp.QuizGen.ansID).button({text:false, icons: {primary: "ui-icon-blank"}, label:"Set the answer key"});
            }

            //Handle the toggling graphics (showing check or not)
            $("#check"+ CW.VideoApp.QuizGen.ansID).change(function (evt) {
                CW.VideoApp.QuizGen.showCorrect(evt.target);
            });

            //Add the delete button
            $("#del"+ CW.VideoApp.QuizGen.ansID).button({text:false, icons: {primary: "ui-icon-circle-close"}});

            //Make the textbox resizable
            $("#ansText"+ CW.VideoApp.QuizGen.ansID).resizable({
                //When I re-width one, re-width them all
                resize:function(event,ui){
                    $(".mcAns").css('width',ui.size.width);  //resize all textareas together
                    $(".mcAns").each(function(i,elem) {     //and their widgets
                    CW.VideoApp.QuizGen.redrawTextareaWidget(elem);
                    });
                }		    
            });

            //On creation, make sure everything looks correct
            $(".mcAns").css('width',Array.max(widths));  //resize all textareas together
            $(".mcAns").each(function(i,elem) {     //and their widgets
                CW.VideoApp.QuizGen.redrawTextareaWidget(elem);
            });
        },

        showCorrect: function (input) {
            if (input.checked) {
                $(input).button('option','icons', {primary: "ui-icon-check"});
            } else { 
                $(input).button('option','icons', {primary: "ui-icon-blank"});
            }
        },

        redrawTextareaWidget: function (elem) {
            $(elem).resizable('widget').css('width',$(elem).width()+6);  //width
            $(elem).resizable('widget').css('height',$(elem).height()+6);  //height
            $(elem).resizable('widget').css('padding-right','1px');          //padding
            $(elem).resizable('widget').css('padding-bottom','0px');
        },

        updateSelector: function () {
            var selector = document.getElementById('selectable');
            while (selector.hasChildNodes()) {
                selector.removeChild(selector.firstChild);
            }


            var item;
            for (j in CW.VideoApp.QuizGen.questions) {
                item = document.createElement('li');
                item.setAttribute('class','ui-widget-content');
                item.setAttribute('title',CW.VideoApp.QuizGen.questions[j].time);
                item.innerHTML = CW.VideoApp.QuizGen.questions[j].qType + ' at ' + timeDisplay(CW.VideoApp.QuizGen.questions[j].time);
                selector.appendChild(item);

            } 

        },

        newQ: function (qType /*1 for MC, other for SA */){

            $('#qInst').show();

            $('#SAbutton').attr('disabled', true);
            $('#MCbutton').attr('disabled', true);
            
            var curTime = Math.floor(CW.VideoApp.cwplayer.getCurrentTime());
            if (CW.VideoApp.QuizGen.questions.hasOwnProperty(curTime)){
                alert('Cannot create question.  There is already a question with this timestamp.');
                return;
            }

            CW.VideoApp.cwplayer.pauseVideo();

            //set up the UI for new question creation
            CW.VideoApp.QuizGen.setupQPane(qType, curTime);  
        },

        saveMC: function (curTime) {

            var qObj = {
                qType: 'm-c', 
                time: curTime, 
                qText: $('#questionText').val(),
                bgOpacity: $("#questionBG").css('opacity'),
                fontColor: $("#questionPane").css('color'),
                qPos: {left:$('#qaSpace').css('left'),top:$('#qaSpace').css('top'),
                       width:$('#questionText').css('width'),height:$('#questionText').css('height')},
                buttonPos: {left:$('#buttonDiv').css('left'),top:$('#buttonDiv').css('top')}
            };

            var ansAry = $('.qChoice');

            var answers = {};

            for (i=0;i<ansAry.length;i++) {
                var curChoiceTR=ansAry[i].children[0];
                answers[i+1] = {
                    text:$(curChoiceTR).find('textarea')[0].value,
                    correct:$(curChoiceTR).find('input:checkbox')[0].checked,
                    tablePos: {left:$(ansAry[i]).css('left'),top:$(ansAry[i]).css('top')},
                    aSize: {width:$(curChoiceTR).find('textarea').css('width'),height:$(curChoiceTR).find('textarea').css('height')}
                };	
            }

            qObj.answers = answers;

            CW.VideoApp.QuizGen.questions[curTime]=qObj;
            CW.VideoApp.QuizGen.updateSelector();

            $('#jsonOutput').val(JSON.stringify(CW.VideoApp.QuizGen.questions));

            if (CW.VideoApp.QuizGen.vidName != "") {
                localStorage[CW.VideoApp.QuizGen.vidName] = JSON.stringify(CW.VideoApp.QuizGen.questions);
            }

            CW.VideoApp.addQuizMarker();

            CW.VideoApp.QuizGen.ajaxSave();
        },

        saveSA: function (curTime) {
            
            var qObj = {qType: 's-a', 
                time: curTime, 
                qText: $('#questionText').val(),
                aText: $('#answerTemplate').val(),
                isRegexp: $('#regexCheck').attr('checked'),
                bgOpacity: $("#questionBG").css('opacity'),
                fontColor: $("#questionPane").css('color'),
                qPos: {left:$('#qaSpace').css('left'),top:$('#qaSpace').css('top'),
                       width:$('#questionText').css('width'),height:$('#questionText').css('height')},
                aPos: {left:$('#saSpace').css('left'),top:$('#saSpace').css('top'),
                       width:$('#answerTemplate').css('width'),height:$('#answerTemplate').css('height')},
                buttonPos: {left:$('#buttonDiv').css('left'),top:$('#buttonDiv').css('top')}
            };

            CW.VideoApp.QuizGen.questions[curTime] = qObj;

            CW.VideoApp.QuizGen.updateSelector();

            $('#jsonOutput').val(JSON.stringify(CW.VideoApp.QuizGen.questions));

            if ( CW.VideoApp.QuizGen.vidName != "") {
                localStorage[CW.VideoApp.QuizGen.vidName] = JSON.stringify(CW.VideoApp.QuizGen.questions);
            }

            CW.VideoApp.addQuizMarker();

            CW.VideoApp.QuizGen.ajaxSave();

        },

        delQ: function (curTime) {

            delete CW.VideoApp.QuizGen.questions[curTime];

            CW.VideoApp.QuizGen.closeQPane();

            CW.VideoApp.QuizGen.updateSelector();

            CW.VideoApp.removeQuizMarker(curTime);

            $('#jsonOutput').val(JSON.stringify(CW.VideoApp.QuizGen.questions));

            if ( CW.VideoApp.QuizGen.vidName != "") {
                localStorage[CW.VideoApp.QuizGen.vidName] = JSON.stringify(CW.VideoApp.QuizGen.questions);
            }

            CW.VideoApp.QuizGen.ajaxSave();

        },

        ansDel: function (id) {
            $("#choice"+id).remove();
        },

        ajaxSave: function () {
            var dataObj = {};
            dataObj.questions = JSON.stringify(CW.VideoApp.QuizGen.questions);
            dataObj.vidID = CW.VideoApp.ytVideoId;
            dataObj.action = 'saveYTQuestions';
            dataObj.course_guid = CW.VideoApp.QuizGen.elgg_course_guid;

            $.ajax({
                type:'POST',
                headers:{'X-Yquiz-Submit':'1'},
                url: elgg.config.wwwroot + "mod/courses/pages/saveYTQuestions.php",
                data: dataObj,
                statusCode: {
                    200:function(data,status) {
                        if (data!="Successfully saved question data") {
                            // alert('Your session with WebAuth might have expired.  Opening a window for you to re-authenticate');
                            // window.open('reauth.php');
                            alert('hello!');
                        } else {
                            alert('Saved to server');
                        }
                    }
                },
                error: function(a,b,c) {
                    alert('An error occurred while connecting with the question storage server.');
                }
            });

        }

    }

}();

$(document).ready(function() {
    // so colorpicker doesn't get clipped on this page
    $('elgg-body').css('overflow', 'visible');

    $("#selectable").selectable({selecting:CW.VideoApp.QuizGen.loadQuestion});

    $("input:submit").button();
    $("input:button").button();

    $('.quizModule').show();
});

/*
function onYouTubePlayerAPIReady() {
  document.getElementById('startmsg').style.display='block';
}
*/

/**
 * Globally-scoped util functions below
 */
function colorToHex(color) {
    if (color.substr(0, 1) === '#') {
        return color;
    }
    var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);
    
    var red = parseInt(digits[2]);
    var green = parseInt(digits[3]);
    var blue = parseInt(digits[4]);
    
    var rgb = blue | (green << 8) | (red << 16);
    return digits[1] + '#' + rgb.toString(16);
};

Array.max = function( array ){
    return Math.max.apply( Math, array );
};

// Function to get the Min value in Array
Array.min = function( array ){
    return Math.min.apply( Math, array );
};

var svade;  // <- What is "svade" for?

function timeDisplay(timeInSec) {
    var min = Math.floor(timeInSec/60);
    var sec = timeInSec - 60*min;
    if (sec<10) sec = '0'+sec;
    return ("" + min + ":" + sec);
}

function onPlayerReady(event) {

    // initializes scrubber and other things in yt.js
    CW.VideoApp.initPlayerReady(event);

    CW.VideoApp.QuizGen.prepareQuizModule(CW.VideoApp.ytVideoId);
    $('#qInst').hide();

    $('#startmsg').css('display','none');
    $('#output').css('display','block');
}

function onPlayerError(event) {
    alert('error');
}

function onPlayerStateChange(event) {
    CW.VideoApp.handlePlayerStateChange(event);
}
