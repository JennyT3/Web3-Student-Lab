const fs = require('fs');
const path = 'c:/Users/sadxxq/Desktop/Web3-Student-Lab/backend/prisma/schema.prisma';

let content = fs.readFileSync(path, 'utf8');

const modelsToUpdate = [
  'Student', 'Course', 'Certificate', 'Enrollment', 'Feedback',
  'LearningProgress', 'AuditLog', 'Canvas'
];

modelsToUpdate.forEach(model => {
  // Regex to match the model block completely
  const modelRegex = new RegExp(`(model ${model} \\{[\\s\\S]*?\\})`, 'g');
  
  content = content.replace(modelRegex, (match) => {
    // Check if workspaceId already exists
    if (match.includes('workspaceId')) {
      return match;
    }
    
    // Find the end of the block
    let updatedMatch = match.replace(/}$/, `  workspaceId String @default("default")\n\n  @@index([workspaceId])\n}`);
    return updatedMatch;
  });
});

fs.writeFileSync(path, content, 'utf8');
console.log('Schema updated.');
