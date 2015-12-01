'use strict';

// SEE README FILE FOR MORE INSTRUCTIONS OR QUESTIONS

var app = angular.module('wizardNewApp')
    .controller('MainCtrl',['$scope', '$log','$http','GetData', function($scope, $log, $http, GetData) {
    // START SET UP APPLICATION VARIABLES AND DATA  
    $scope.questions = [];// holds all of the question data retrieved from json file
    $scope.proto = {}; // this will hold a prototype of an empty object similar to our answers
    $scope.scoreTally = []; // holds one object value for each answered question
    $scope.currentScore = {}; // this holds our total current score for our quiz when we add up all the scoreTally objects
    $scope.results = {}; // this will hold the final results
    
    $scope.numQuestions = 0; // holds total number of questions initialized in our quiz
    $scope.currentQuestion = 0; // keep track of the current question we are answering
    $scope.numComparisons = 0; // we want to know how many items we are comparing ex: How many entities, how many foods etc
    $scope.maxValue = 0; // the maximum supplied answer in our quiz data. This will normalize the display of the comparisons
    $scope.maxAnswerValues = []; // holds the highest posibile score for every question as an object
    $scope.highestScore = 0;
    
    $scope.showFinish = false; // when we have made a choice or reached the end of the quiz we display the finish button
    $scope.showResults = false; // when we finish the entire quiz we show the results div
    $scope.winners = []; // this will hold all of the highest scores as their ids which we will use to retrieve the results data
    $scope.showAnswer = 0; // Shows us multiple answers given there is a tie
    
// INITIALIZE --- USE OUR AJAX SERVICE TO GET JSON FILE AND CHECK IT FOR ERRORS,  THEN INIT ALL VARIABLES
    GetData.populate().then(function(data) {
        if(data.data.questions){
            $scope.questions = data.data.questions;
            $scope.numQuestions = Object.keys($scope.questions).length; // Get the total number of questions found
            console.log("Setting up the quiz application. Data was found.");
        }
        else{
            console.log("Questions object not found. Json object is improperly formatted.");
        }
        $scope.numComparisons = Object.keys($scope.questions[0].answers[0]).length; // set the number of items we should be comparing by looking at the first answer of the first question. We check later to see if the others are the same.
        console.log("The number of items we are comparing is " + ($scope.numComparisons -1)); // subtract one since angular maintains a hash for watching object changes 
        // FOR EVERY QUESTION
        for(var question in $scope.questions){ 
            var temp = {}; // Stuff in the highest possible value for each question later
            // FOR EVERY ANSWER
            for(var ans in $scope.questions[question].answers){
                if(Object.keys($scope.questions[question].answers[ans]).length != $scope.numComparisons){ // ensure they all have the same number of answers
                    console.error("Answers in your JSON file must all supply the same amount of comparisons. Make sure all answers supply the same amount of data.");
                }
                // FIND MAX VALUE FOR OUR CHOICES TO PROPERLY SCALE THE DISPLAY //
                var answer = $scope.questions[question].answers[ans]; // answer for the current question
                for(var prop in answer){ // loop through properties
                    if(prop != "stringvalue"){ // we dont need the text of the question its irrelevant
                        var num; // set up our total to be zero if its NAN, 'disable', or a negative number
                        if(angular.isNumber(answer[prop])){
                            num = parseInt(answer[prop]); // get our property and turn it into a number  
                        }
                        else{
                            num = 0;
                        } 
                        if(temp.hasOwnProperty(prop)){ // if the property already exists
                            if($scope.questions[question].allowMultiple == 1){ // if we allow multiple you could supply every answer so add them all in
                                temp[prop] += num;
                            }
                            else{ // if we dont allow multiple then only one answer is provided at the same time, so just get the biggest number
                                if(temp[prop]< num){ // if our new number is higher than the highest on record
                                    temp[prop] = num; // store it as the new highest score for that property
                                }   
                            }
                        }
                        else{
                            Object.defineProperty(temp, prop, { // the property has not been defined so lets create it now
                            value: num,
                            writable: true,
                            enumerable: true,
                            configurable: true
                            });
                        }
                    }
                }
            }
            // FILL $scope.maxAnswerValues WITH THE HIGHEST POSIBLE SCORE FOR EACH QUESTION
            for(var prop in temp){
                if($scope.maxAnswerValues.hasOwnProperty(prop)){
                $scope.maxAnswerValues[prop] += temp[prop];
                }
                else{
                    Object.defineProperty($scope.maxAnswerValues, prop, { // the property has not been defined so lets create it now
                    value: temp[prop],
                    writable: true,
                    enumerable: true,
                    configurable: true
                    });
                }
            }
        }
        for(var value in $scope.maxAnswerValues){
            if($scope.maxAnswerValues[value] > $scope.highestScore){
                $scope.highestScore = $scope.maxAnswerValues[value];
            }
        }
        console.log("To achieve a 100 percent rating, any item must reach a score of " + $scope.highestScore) 
        // GET RESULTS DATA 
        if(data.data.results[0]){
            $scope.results = data.data.results; // get local app data variables non functional decorative variables for title etc
        }
        else{console.warn("You have not properly provided results for your quiz. See README.md for more details.");}
           
        // GET APPLICATION DATA
        if(data.data.appData){
            $scope.appData = data.data.appData[0]; // get local app data variables non functional decorative variables for title etc
        }
        else{console.warn("Application information has not been supplied in JSON object. Some decorative values will be missing.");}
        $scope.createEmptyScore(); //initialize current score
        $scope.creatPrototype();
    });
// END INITIALIZE    
    
// CALCULATE SCORES AND DISPLAY ITEM COMPARISONS 
    $scope.calculateComparision = function(questionNumber, vm){
        var objToAdd = {};
        $scope.currentScore  = {};
        if($scope.questions[questionNumber].allowMultiple != 1){ // if we chose radio buttons for the questions
            $scope.scoreTally[questionNumber] = vm; // get the value of that question from our data and add it into our scoreTally for the question
        } 
        else{ // if we chose checkboxes for this question
            var checkboxes = document.getElementsByClassName('question' + questionNumber.toString()); // get all checkboxes at current question index
            var len = 0;
            var none = 0;
            for(var i = 0; i < checkboxes.length; i++){
                if(checkboxes[i].checked){ // check if each one is checked
                    var checkValue = angular.fromJson(checkboxes[i].value); // if it is put the value in here as an object
                    objToAdd =  $scope.addObjects(checkValue,objToAdd); // add the values of the checked boxes together into one object
                    len++;
                    if(checkValue.stringvalue == "None"){
                        for(var x = 0; x < checkboxes.length; x++){
                           checkboxes[x].checked = false; 
                        }
                        checkboxes[i].checked = true;
                        none = 1; // if we offer none option we want to supply no score, and deactivate other checkboxes
                    }
                }// end for each box checked 
            }// end iteration over checkboxes
            if(none == 1){ // if the checkboxes are all unchecked or we answered none
                $scope.scoreTally[questionNumber] = $scope.proto; // here we will stuff in the prototype instead
            }
            else if(len == 0 ){
               $scope.scoreTally.splice(questionNumber, 1);
            }
            else{
                $scope.scoreTally[questionNumber] = objToAdd // stuff our cleaned out combined object into our tally
            }
        }
        for(var ans in $scope.scoreTally){ // loop through all of the scores and create a final score
            if(Object.keys($scope.scoreTally[ans]).length){
                $scope.currentScore = $scope.addObjects($scope.scoreTally[ans], $scope.currentScore);
            }
            else{
                $scope.createEmptyScore(); // or create a generic empty score since we have nothing to tally up yet
            }
        }
        for(var score in $scope.currentScore){
            if($scope.currentScore[score] >= $scope.highestScore){ // set a check if we find a winner early, and so we never exceed 100%
               $scope.currentScore[score] = $scope.highestScore; 
               $scope.showResult();
            }
        }
    }
// END CALCULATE SCORE
    
// START REUSABLE FUNCTIONS -----------------------------------------------------------------------------
    // ADD SCORE FOR ALL ANSWERED QUESTIONS AND RETURN ONE COMBINED OBJECT WITH THE TOTAL
    $scope.addObjects = function(obj1, obj2){
        for( var el in obj1 ) {
            if( obj1.hasOwnProperty( el ) ) {
                if(obj2[el]){ // if its not empty we work with it otherwise create it
                    if( angular.isNumber(obj1[el]) && angular.isNumber(obj2[el])){ // if both values are numbers add them
                        obj2[el]  +=  parseFloat( obj1[el] );
                        if(parseFloat( obj2[el] ) < 0 ){
                            obj2[el] = 0; // negative value never allowed for any score
                        }
                    }
                    else{
                        obj2[el] = 'disable';
                    }
                }
                else{
                    if( angular.isNumber( obj1[el])){
                        obj2[el] =  parseFloat( obj1[el]);
                        if(parseFloat( obj2[el] ) < 0 ){
                            obj2[el] = 0; // negative value never allowed for any score
                        }
                    }
                    else{
                        obj2[el] = 'disable';
                    }    
                }
            }
        }
    return obj2;          
    }
    // FIND OJECT IN ARRAY BY SEARCHING KEYS
    $scope.objectFindByKey = function(array, key, value) {
        for (var i = 0; i < array.length; i++) {
            if (array[i][key] === value) {
                return array[i];
            }
        }
        return null;
    }
    // USE ANGULAR NUMBER DETECTION FUNCTION IN THE SCOPE OF OUR VIEW
    $scope.isNumber = angular.isNumber; 
    // FUNCTION THAT HANDLES ANIMATIONS ON OUR SCROLLBARS
    $scope.updatePoints = function(value){
        return {'width': (value / $scope.highestScore) * 100+'%', 'transition': 'width .4s' , '-webkit-transition': 'width .4s'};
    }
    // FUNCTION THAT HANDLES ANIMATIONS ON OUR PROGRESS BAR
    $scope.updateProgress = function(value){
        return {'width': (($scope.currentQuestion + 1) / $scope.numQuestions) * 100+'%', 'transition': 'width .4s' , '-webkit-transition': 'width .4s'};
    }
    // CREATE A GENERIC EMPTY SCORE OBJECT FOR INITIALIZATION AND ERROR HANDLING
    $scope.createEmptyScore = function(){
        for(var value in Object.keys($scope.questions[0].answers[0])){ // for every possible comparable item
            var keyname = Object.keys($scope.questions[0].answers[0])[value];
            $scope.currentScore[keyname] = 0;
        }
    }
    $scope.creatPrototype = function(){
        $scope.proto = angular.copy($scope.questions[0].answers[0]); // get the first answer object and make a copy
        for(var item in $scope.proto){
            $scope.proto[item] = 0; // set it all equal to zero so its cleaned out of values.
        }
    }
    // USER INTERACTION FUNCTIONS ----------------------------------------------------------------------------
    // HANDLE NEXT BUTTONS
    $scope.nextQuestion = function(position){
        if((position + 1) < $scope.numQuestions){
            $scope.currentQuestion = position + 1; // get the next question by incrementing our position by one 
        }
        if((position + 2) == $scope.numQuestions){ // if the next question will be the last prepare the finish button
            $scope.showFinish = true;
        }
    }
    // HANDLE PREVIOUS BUTTONS
    $scope.previousQuestion = function(position){
        if((position)> 0){
            $scope.currentQuestion = position - 1; // get the previous question by decreasing our postion by one
        }
        if(($scope.currentQuestion) < $scope.numQuestions){ // hide finish if we naVigate backwards from last step
            $scope.showFinish = false;
        }
    }
    // HANDLE PAGING THROUGH MUTLIPLE ANSWERS IF APPLICABLE
    $scope.prevResult = function(){
        if($scope.showAnswer > 0){
           $scope.showAnswer -= 1; 
        }
    }
    $scope.nextResult = function(){
        if($scope.showAnswer < $scope.winners.length - 1){
           $scope.showAnswer += 1; 
        }
    }
    // HANDLE FINISH FUNCTION
    $scope.showResult = function(){
        $scope.showResults = true;
        $scope.winners = []; // recaluclate everytime we call the function
        var quizChoice = '';
        var max = 0;
        for(var score in $scope.currentScore){ // find the highest final score
            if(max < $scope.currentScore[score] && angular.isNumber($scope.currentScore[score])){
                max = $scope.currentScore[score];
                quizChoice = score;
            }
        }
        var count = 0; // now check for a tie between any number of other choices as a safeguard and create an array of possible answers       
        for(var score in $scope.currentScore){ 
            if(max == $scope.currentScore[score] && angular.isNumber($scope.currentScore[score])){
                $scope.winners[count] = $scope.objectFindByKey($scope.results, 'choice', score); // get every winning value and create an array of the answers from the results object
                count += 1;
            }
        }
    }
    // HANDLE BACK TO QUIZ BUTTON
    $scope.backToQuiz = function(){
        $scope.showResults = false;
    }
    // ENABLE NEXT AND FINISH BUTTON ONLY IF QUESTION IS ANSWERED
    $scope.enableBtn = function(index){
        if(($scope.scoreTally[index] != null) && (Object.keys($scope.scoreTally[index]).length)){ //check if there is an answer for this question
            return false;
        }
        else{
            return true;
        }
    }
    // RESTART THE QUIZ FROM THE BEGINING
    $scope.restart = function(){
        $scope.showFinish = false;
        $scope.showResults = false;
        $scope.currentQuestion = 0;
        $scope.createEmptyScore();
        document.getElementById("wizard").reset();
    }
}]);
// END REUSABLE FUNCTIONS

// START APPLICATION SERVICES ------------------------------------------------------------------------------
app.service("GetData", ["$http", function($http) {
  this.populate = function(){
    return $http.get("/json/wizarddata.json").then(function(data){
      return data;
    },function(){
      console.error("Json File you provided was not found, please check your data url.");
    }
    );
  }
}]);

// START CUSTOM FILTERS --------------------------------------------------------------------------------------
app.filter('stringify', function() {
  return function(input) {
     var out = input.replace(/_/g, " ");
    return out;
 }});
 app.filter('setDecimal', function ($filter) {
    return function (input, places) {
        if (isNaN(input)) return input;
        // If we want 1 decimal place, we want to mult/div by 10
        // If we want 2 decimal places, we want to mult/div by 100, etc
        // So use the following to create that factor
        var factor = "1" + Array(+(places > 0 && places + 1)).join("0");
        return Math.round(input * factor) / factor;
    };
});