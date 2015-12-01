# wizard-new
## Build & development

Run `grunt` for building and `grunt serve` for preview.

## Testing

Running `grunt test` will run the unit tests with karma.

## Usage

This application reads a json data file and parses it into a quiz to determine the best choice for .. well anything. There are a few 
required constructs in your supplied data file that are mandatory. 

Data Structure
------------------------
appData : while not required, appData is where you will define your title and description for the app as well as a version number
questions : a questions object is required, which contains all of the questions data for the quiz. Each questions object should contain:
	1. question: the text you wish to display as a question
	2. footnote: (optional) - an additional helpful footnote for users to get more information
	3. allowMultiple: (optional) - boolean, 1 displays question as multiple selected checkmarks, 0 shows radio buttons where only one answer is allowed. Default is radio buttons.
	4. answers: contains and array of objects that represent your possible answers for the question. Each one should contain:
		A. stringvalue: the text value for the answer displayed to your user
				The only special value for stringvalue is "None", if this is supplied as an answer in a check box group, it will deselect all other answers and provide a prototype empty answer with no value
		B. values: unlimited key value pairs can be provided as items to compare. Provide a value towards a choice for any answer selected (any scale will work).
				You may provide the value 'disable' if a certain answer makes the answer impossible to win the final outcome 
				It is required to have the same number of key/value pairs for every answer of every question.
				competing values will be displayed by name in the application. Separate words must be separated with an underscore and will output with a space instead. IE: grilled_cheese = Grilled Cheese

results : contains the data to show when a choice is made. You nust provide an result for every item compared.

See sample json file for more information