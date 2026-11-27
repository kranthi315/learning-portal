export const courses = [
  { id: 'az900', title: 'Azure Fundamentals', code: 'AZ-900', category: 'Cloud', difficulty: 'Beginner', duration: '8 hours', instructor: 'Sarah Chen', progress: 68, enrolled: true, color: 'blue', icon: '☁', description: 'Build your cloud confidence. Explore core Azure services, cloud concepts, security, and pricing.' },
  { id: 'az104', title: 'Azure Administrator', code: 'AZ-104', category: 'Cloud', difficulty: 'Intermediate', duration: '24 hours', instructor: 'Marcus Lee', progress: 34, enrolled: true, color: 'purple', icon: '▦', description: 'Learn to implement, manage, and monitor identity, governance, storage, and compute in Azure.' },
  { id: 'az500', title: 'Azure Security Technologies', code: 'AZ-500', category: 'Security', difficulty: 'Advanced', duration: '18 hours', instructor: 'Amina Patel', progress: 0, enrolled: true, color: 'orange', icon: '◇', description: 'Build the skills to manage identity, implement platform protection, and secure data and applications.' },
  { id: 'ai900', title: 'Azure AI Fundamentals', code: 'AI-900', category: 'AI & data', difficulty: 'Beginner', duration: '10 hours', instructor: 'Olivia Park', progress: 100, enrolled: true, color: 'teal', icon: '✳', description: 'Discover machine learning, computer vision, NLP, and generative AI on Microsoft Azure.' },
  { id: 'ai102', title: 'Azure AI Engineer Associate', code: 'AI-102', category: 'AI & data', difficulty: 'Intermediate', duration: '20 hours', instructor: 'Olivia Park', progress: 0, enrolled: false, color: 'pink', icon: '✦', description: 'Design and implement AI solutions using Azure AI services, Azure AI Search, and Azure OpenAI.' },
  { id: 'arch', title: 'Azure Infrastructure & Architecture', code: 'AZ-305', category: 'Architecture', difficulty: 'Advanced', duration: '16 hours', instructor: 'Daniel Wright', progress: 0, enrolled: false, color: 'indigo', icon: '⌘', description: 'Design resilient infrastructure solutions for identity, governance, data, and business continuity.' },
  { id: 'network', title: 'Azure Networking Fundamentals', code: 'AZ-700', category: 'Networking', difficulty: 'Intermediate', duration: '12 hours', instructor: 'Priya Nair', progress: 0, enrolled: false, color: 'cyan', icon: '⌁', description: 'Connect and protect Azure resources with virtual networks, routing, load balancing, and private access.' },
  { id: 'devops', title: 'Azure DevOps Fundamentals', code: 'AZ-400', category: 'DevOps', difficulty: 'Intermediate', duration: '14 hours', instructor: 'Noah Kim', progress: 0, enrolled: false, color: 'green', icon: '⟳', description: 'Plan, build, and deliver software with modern DevOps practices and Azure tooling.' },
];

export const lessons = [
  { title: 'Welcome to Azure', duration: '4 min', type: 'video' },
  { title: 'What is cloud computing?', duration: '12 min', type: 'video' },
  { title: 'Cloud deployment models', duration: '8 min', type: 'video' },
  { title: 'Knowledge check: cloud concepts', duration: '5 min', type: 'quiz' },
  { title: 'Explore Azure regions', duration: 'PDF · 2.4 MB', type: 'document' },
  { title: 'Azure architecture fundamentals', duration: '18 min', type: 'video' },
];

export const assignments = [
  { id: 1, title: 'Cloud architecture diagram', course: 'Azure Fundamentals', due: 'Nov 28, 2026', status: 'In Progress', detail: 'Create a cloud architecture diagram for a sample retail application. Include compute, storage, networking, and security services. Submit your diagram with a short explanation of your design choices.' },
  { id: 2, title: 'Identity & access review', course: 'Azure Administrator', due: 'Nov 30, 2026', status: 'Not Started', detail: 'Review the provided scenario and recommend an identity and access strategy. Address role-based access control, least privilege, and access reviews.' },
  { id: 3, title: 'AI responsible use reflection', course: 'Azure AI Fundamentals', due: 'Dec 04, 2026', status: 'Submitted', detail: 'Write a short reflection on responsible AI principles and how they apply to a real-world AI solution.' },
  { id: 4, title: 'Secure a storage account', course: 'Azure Administrator', due: 'Nov 20, 2026', status: 'Graded', detail: 'Configure and document a secure Azure Storage account following the course lab.' },
  { id: 5, title: 'Virtual network security lab', course: 'Azure Security Technologies', due: 'Nov 24, 2026', status: 'Under Review', detail: 'Configure network security groups and private connectivity for the sample Azure environment. Include a short explanation of your security choices.' },
  { id: 6, title: 'Incident response tabletop', course: 'Azure Security Technologies', due: 'Nov 22, 2026', status: 'Rejected', detail: 'Document an incident response plan for the supplied cloud security scenario. Update the submission to include clear containment and recovery steps.' },
];

export const quizQuestions = [
  { type: 'single', question: 'Which Azure service provides virtual machines on demand?', options: ['Azure Functions', 'Azure Virtual Machines', 'Azure Cosmos DB', 'Azure DevOps'], answer: 1 },
  { type: 'truefalse', question: 'Azure availability zones are physically separate locations within an Azure region.', options: ['True', 'False'], answer: 0 },
  { type: 'multi', question: 'Which are benefits of cloud computing? Select all that apply.', options: ['High availability', 'Unlimited free resources', 'Scalability', 'Global reach'], answer: [0, 2, 3] },
];

export const notifications = [
  { icon: 'CalendarDays', title: 'Assessment coming up', text: 'Azure Fundamentals assessment is scheduled for Friday, Nov 27.', time: '2 hours ago', unread: true },
  { icon: 'FileCheck2', title: 'Assignment submitted', text: 'Your AI responsible use reflection was submitted successfully.', time: 'Yesterday', unread: true },
  { icon: 'Award', title: 'Certification earned', text: 'Congratulations! You earned Azure AI Fundamentals.', time: 'Nov 18', unread: false },
  { icon: 'BookOpen', title: 'New course assigned', text: 'Azure Administrator has been added to your learning plan.', time: 'Nov 15', unread: false },
];
