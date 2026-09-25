export const mockUsers = [
  {
    _id: '64f8a123b0a9c12345678901',
    username: 'admin',
    password: 'adminpassword123',
    userType: 'Admin',
    firstName: 'Admin',
    lastName: 'System',
    isActive: true,
  },
  {
    _id: '64f8a123b0a9c12345678902',
    username: 'judge_donde',
    password: 'password123',
    userType: 'Judge',
    firstName: 'Nay',
    lastName: 'Donde',
    isActive: true,
  },
];

export const mockJudges = [
  {
    _id: '65f8a123b0a9c12345678901',
    username: 'judge001',
    password: 'password123',
    firstName: 'Mario',
    lastName: 'Kart',
    userType: 'Judge',
    isActive: true,
  },
  {
    _id: '65f8a123b0a9c12345678902',
    username: 'judge002',
    password: 'password123',
    firstName: 'Mia',
    lastName: 'Luna',
    userType: 'Judge',
    isActive: true,
  },
];

export const mockConfiguration = {
  _id: '65f8a123b0a9c12345678900',
  eventTitle: '2026 Mr & Ms CCS',
  eventDescription: 'The MR and MS CCS of Acquaintance Party',
  isConfigurationMode: true,
  stats: {
    totalJudges: 5,
    totalContestants: 8,
  },
  liveStatus: {
    categoryActive: { _id: '65f8a123b0a9c12345678910', name: 'Playsuit' },
    contestantActive: {
      _id: '65f8a123b0a9c12345678920',
      name: 'Jopeta Mari',
      image: 'https://cdn.example.com/photos/contestant1.jpg',
      label: '1st Year (1)',
      group: 'Pageant Male',
    },
  },
};
