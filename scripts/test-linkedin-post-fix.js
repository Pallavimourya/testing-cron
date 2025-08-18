const mongoose = require('mongoose');

// Test the ObjectId validation logic
function testObjectIdValidation() {
  console.log('Testing ObjectId validation logic...');
  
  const testCases = [
    '21', // String ID that was causing the error
    '507f1f77bcf86cd799439011', // Valid ObjectId
    'invalid-object-id', // Invalid ObjectId
    '123', // Short string
    '507f1f77bcf86cd799439012' // Another valid ObjectId
  ];
  
  testCases.forEach(testCase => {
    const isValid = mongoose.Types.ObjectId.isValid(testCase);
    console.log(`"${testCase}" is valid ObjectId: ${isValid}`);
    
    if (isValid) {
      try {
        const objectId = new mongoose.Types.ObjectId(testCase);
        console.log(`  Successfully created ObjectId: ${objectId}`);
      } catch (error) {
        console.log(`  Error creating ObjectId: ${error.message}`);
      }
    }
  });
}

// Test the query construction logic
function testQueryConstruction() {
  console.log('\nTesting query construction logic...');
  
  const contentId = '21';
  const userId = '507f1f77bcf86cd799439011';
  
  // Simulate the fixed query logic
  const query = {
    $or: [
      { id: contentId },
      // Only try _id if contentId is a valid ObjectId
      ...(mongoose.Types.ObjectId.isValid(contentId) ? [{ _id: new mongoose.Types.ObjectId(contentId) }] : [])
    ],
    userId: userId
  };
  
  console.log('Query for contentId "21":', JSON.stringify(query, null, 2));
  
  const queryWithValidObjectId = {
    $or: [
      { id: '507f1f77bcf86cd799439011' },
      // Only try _id if contentId is a valid ObjectId
      ...(mongoose.Types.ObjectId.isValid('507f1f77bcf86cd799439011') ? [{ _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') }] : [])
    ],
    userId: userId
  };
  
  console.log('Query for valid ObjectId:', JSON.stringify(queryWithValidObjectId, null, 2));
}

// Run tests
testObjectIdValidation();
testQueryConstruction();

console.log('\n✅ Test completed. The fix should prevent ObjectId casting errors for string IDs.');
