import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'supersecretmockkey123';

export const generateId = () =>
  [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

export const db = {
  configuration: {
    _id: "65f8a123b0a9c12345678900",
    eventTitle: "2026 Mr & Ms CCS",
    eventDescription: "The MR and MS CCS Acquaintance Party Pageant",
    isConfigurationMode: true,
    stats: {
      totalJudges: 5,
      totalContestants: 8
    },
    liveStatus: {
      categoryActive: {
        _id: "65f8a123b0a9c12345678910",
        name: "Playsuit"
      },
      contestantActive: {
        _id: "65f8a123b0a9c12345678920",
        name: "Jopeta Mari",
        image: "https://cdn.example.com/photos/male1.jpg",
        label: "1st Year (1)",
        group: "Pageant Male"
      }
    }
  },

  judges: [
    {
      _id: "65f8a123b0a9c12345678900",
      username: "admin",
      password: "adminpassword123",
      firstName: "Admin",
      lastName: "System",
      userType: "Admin",
      isActive: true
    },
    {
      _id: "65f8a123b0a9c12345678901",
      username: "judge_donde",
      password: "password123",
      firstName: "Nay",
      lastName: "Donde",
      userType: "Judge",
      isActive: true
    },
    {
      _id: "65f8a123b0a9c12345678902",
      username: "judge_lester",
      password: "password123",
      firstName: "Sir",
      lastName: "Lester",
      userType: "Judge",
      isActive: true
    },
    {
      _id: "65f8a123b0a9c12345678903",
      username: "judge_daynver",
      password: "password123",
      firstName: "Sir",
      lastName: "Daynver",
      userType: "Judge",
      isActive: true
    },
    {
      _id: "65f8a123b0a9c12345678904",
      username: "judge_jhunie",
      password: "password123",
      firstName: "Sir Jhunie",
      lastName: "Jumawan",
      userType: "Judge",
      isActive: true
    },
    {
      _id: "65f8a123b0a9c12345678905",
      username: "judge_noreen",
      password: "password123",
      firstName: "Ma'am Noreen",
      lastName: "Lagahit",
      userType: "Judge",
      isActive: true
    }
  ],

  categories: [
    {
      _id: "65f8a123b0a9c12345678910",
      name: "Playsuit",
      description: "Evaluates physique, poise, and presentation in swimwear.",
      weight: 10,
      isActive: true,
      rubrics: [
        { _id: "65f8a123b0a9c12345678911", name: "Fitness & Form", maxPoints: 40 },
        { _id: "65f8a123b0a9c12345678912", name: "Stage Presence", maxPoints: 40 },
        { _id: "65f8a123b0a9c12345678913", name: "Poise & Bearing", maxPoints: 20 }
      ]
    },
    {
      _id: "65f8a123b0a9c12345678914",
      name: "Evening Gown / Formal Wear",
      description: "Evaluates gracefulness, carriage, and regal demeanor.",
      weight: 10,
      isActive: true,
      rubrics: [
        { _id: "65f8a123b0a9c12345678915", name: "Elegance & Carriage", maxPoints: 40 },
        { _id: "65f8a123b0a9c12345678916", name: "Suitability & Fit", maxPoints: 30 },
        { _id: "65f8a123b0a9c12345678917", name: "Stage Presence", maxPoints: 30 }
      ]
    },
    {
      _id: "65f8a123b0a9c12345678918",
      name: "System Uni",
      description: "Evaluates proper dress code adherence and deportment.",
      weight: 5,
      isActive: true,
      rubrics: [
        { _id: "65f8a123b0a9c12345678919", name: "Adherence & Neatness", maxPoints: 50 },
        { _id: "65f8a123b0a9c1234567892a", name: "Bearing & Deportment", maxPoints: 50 }
      ]
    },
    {
      _id: "65f8a123b0a9c1234567892b",
      name: "Production Number",
      description: "Evaluates dance execution, vitality, and introduction clarity.",
      weight: 10,
      isActive: true,
      rubrics: [
        { _id: "65f8a123b0a9c1234567892c", name: "Choreography Mastery", maxPoints: 40 },
        { _id: "65f8a123b0a9c1234567892d", name: "Energy & Showmanship", maxPoints: 40 },
        { _id: "65f8a123b0a9c1234567892e", name: "Individual Introduction", maxPoints: 20 }
      ]
    },
    {
      _id: "65f8a123b0a9c1234567892f",
      name: "Advocacy",
      description: "Evaluates community relevance, knowledge, and presentation passion.",
      weight: 15,
      isActive: true,
      rubrics: [
        { _id: "65f8a123b0a9c12345678930", name: "Relevance & Impact", maxPoints: 40 },
        { _id: "65f8a123b0a9c12345678931", name: "Substance & Knowledge", maxPoints: 30 },
        { _id: "65f8a123b0a9c12345678932", name: "Passion & Authenticity", maxPoints: 30 }
      ]
    },
    {
      _id: "65f8a123b0a9c12345678933",
      name: "Q&A - Closed Door",
      description: "Evaluates depth of thought, logic, composure under panel.",
      weight: 20,
      isActive: true,
      rubrics: [
        { _id: "65f8a123b0a9c12345678934", name: "Substance & Depth", maxPoints: 40 },
        { _id: "65f8a123b0a9c12345678935", name: "Articulation", maxPoints: 40 },
        { _id: "65f8a123b0a9c12345678936", name: "Composure", maxPoints: 20 }
      ]
    },
    {
      _id: "65f8a123b0a9c12345678937",
      name: "Q&A - Final",
      description: "Evaluates concise answers, delivery, and grace under pressure.",
      weight: 30,
      isActive: true,
      rubrics: [
        { _id: "65f8a123b0a9c12345678938", name: "Content & Relevance", maxPoints: 40 },
        { _id: "65f8a123b0a9c12345678939", name: "Delivery & Articulation", maxPoints: 30 },
        { _id: "65f8a123b0a9c12345678940", name: "Grace Under Pressure", maxPoints: 30 }
      ]
    }
  ],

  contestantGroups: [
    {
      _id: "65f8a123b0a9c12345678930",
      name: "Pageant Male",
      categoriesIncluded: [
        "65f8a123b0a9c12345678910",
        "65f8a123b0a9c12345678914",
        "65f8a123b0a9c12345678918",
        "65f8a123b0a9c1234567892b",
        "65f8a123b0a9c1234567892f",
        "65f8a123b0a9c12345678933",
        "65f8a123b0a9c12345678937"
      ]
    },
    {
      _id: "65f8a123b0a9c12345678931",
      name: "Pageant Female",
      categoriesIncluded: [
        "65f8a123b0a9c12345678910",
        "65f8a123b0a9c12345678914",
        "65f8a123b0a9c12345678918",
        "65f8a123b0a9c1234567892b",
        "65f8a123b0a9c1234567892f",
        "65f8a123b0a9c12345678933",
        "65f8a123b0a9c12345678937"
      ]
    }
  ],

  contestants: [
    {
      _id: "65f8a123b0a9c12345678920",
      name: "Jopeta Mari",
      label: "1st Year (1)",
      image: "https://cdn.example.com/photos/male1.jpg",
      group: "65f8a123b0a9c12345678930"
    },
    {
      _id: "65f8a123b0a9c12345678921",
      name: "Juan Dela Cruz",
      label: "2nd Year (2)",
      image: "https://cdn.example.com/photos/male2.jpg",
      group: "65f8a123b0a9c12345678930"
    },
    {
      _id: "65f8a123b0a9c12345678922",
      name: "Mark Anthony",
      label: "3rd Year (3)",
      image: "https://cdn.example.com/photos/male3.jpg",
      group: "65f8a123b0a9c12345678930"
    },
    {
      _id: "65f8a123b0a9c12345678923",
      name: "Christian Paul",
      label: "4th Year (4)",
      image: "https://cdn.example.com/photos/male4.jpg",
      group: "65f8a123b0a9c12345678930"
    },
    {
      _id: "65f8a123b0a9c12345678924",
      name: "Maria Santos",
      label: "1st Year (1)",
      image: "https://cdn.example.com/photos/female1.jpg",
      group: "65f8a123b0a9c12345678931"
    },
    {
      _id: "65f8a123b0a9c12345678925",
      name: "Angela Nicole",
      label: "2nd Year (2)",
      image: "https://cdn.example.com/photos/female2.jpg",
      group: "65f8a123b0a9c12345678931"
    },
    {
      _id: "65f8a123b0a9c12345678926",
      name: "Bea Alonzo",
      label: "3rd Year (3)",
      image: "https://cdn.example.com/photos/female3.jpg",
      group: "65f8a123b0a9c12345678931"
    },
    {
      _id: "65f8a123b0a9c12345678927",
      name: "Christine Joy",
      label: "4th Year (4)",
      image: "https://cdn.example.com/photos/female4.jpg",
      group: "65f8a123b0a9c12345678931"
    }
  ],

  scores: [
    {
      _id: "65f8a123b0a9c12345678999",
      judgeId: "65f8a123b0a9c12345678901",
      categoryId: "65f8a123b0a9c12345678910",
      contestantId: "65f8a123b0a9c12345678920",
      rubricsScore: [
        { rubricsId: "65f8a123b0a9c12345678911", score: 38 },
        { rubricsId: "65f8a123b0a9c12345678912", score: 35 },
        { rubricsId: "65f8a123b0a9c12345678913", score: 18 }
      ]
    },
    {
      _id: "65f8a123b0a9c12345678998",
      judgeId: "65f8a123b0a9c12345678902",
      categoryId: "65f8a123b0a9c12345678910",
      contestantId: "65f8a123b0a9c12345678920",
      rubricsScore: [
        { rubricsId: "65f8a123b0a9c12345678911", score: 36 },
        { rubricsId: "65f8a123b0a9c12345678912", score: 37 },
        { rubricsId: "65f8a123b0a9c12345678913", score: 19 }
      ]
    }
  ]
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication token missing or invalid",
        details: []
      }
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Token missing, invalid, or expired.",
          details: []
        }
      });
    }
    req.user = user;
    next();
  });
};

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// 1. AUTHENTICATION MODULE
app.post('/api/v1-mock/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.judges.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid username or password",
        details: []
      }
    });
  }

  const tokenPayload = {
    _id: user._id,
    username: user.username,
    userType: user.userType,
    firstName: user.firstName,
    lastName: user.lastName
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: tokenPayload,
      expiresAt
    }
  });
});

app.post('/api/v1-mock/auth/logout', authenticateToken, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
});

// 2. CONFIGURATIONS MODULE
app.get('/api/v1-mock/configuration', authenticateToken, (req, res) => {
  db.configuration.stats.totalJudges = db.judges.filter(j => j.userType === 'Judge').length;
  db.configuration.stats.totalContestants = db.contestants.length;

  return res.status(200).json({
    success: true,
    data: db.configuration
  });
});

app.put('/api/v1-mock/configuration', authenticateToken, (req, res) => {
  const { eventTitle, eventDescription } = req.body;

  if (!eventTitle || typeof eventTitle !== 'string' || eventTitle.trim() === '') {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "eventTitle is required and cannot be empty",
        details: [{ field: "eventTitle", issue: "Must be a non-empty string" }]
      }
    });
  }

  if (eventTitle) db.configuration.eventTitle = eventTitle;
  if (eventDescription !== undefined) db.configuration.eventDescription = eventDescription;

  return res.status(200).json({
    success: true,
    message: "Configuration updated successfully",
    data: {
      _id: db.configuration._id,
      eventTitle: db.configuration.eventTitle,
      eventDescription: db.configuration.eventDescription
    }
  });
});

app.patch('/api/v1-mock/configuration/live-status', authenticateToken, (req, res) => {
  const { categoryActive, contestantActive } = req.body;

  const category = db.categories.find(c => c._id === categoryActive);
  const contestant = db.contestants.find(c => c._id === contestantActive);

  if (!category || !contestant) {
    return res.status(404).json({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "Specified active category or contestant does not exist",
        details: !category ? [{ field: "categoryActive", issue: "Category ID not found" }] : [{ field: "contestantActive", issue: "Contestant ID not found" }]
      }
    });
  }

  const group = db.contestantGroups.find(g => g._id === contestant.group);

  db.configuration.liveStatus = {
    categoryActive: {
      _id: category._id,
      name: category.name
    },
    contestantActive: {
      _id: contestant._id,
      name: contestant.name,
      image: contestant.image,
      label: contestant.label,
      group: group ? group.name : ''
    }
  };

  return res.status(200).json({
    success: true,
    message: "Live status updated successfully",
    data: { categoryActive, contestantActive }
  });
});

// 3. JUDGES MANAGEMENT MODULE
app.get('/api/v1-mock/judges', authenticateToken, (req, res) => {
  const list = db.judges.map(({ password, ...rest }) => rest);
  return res.status(200).json({ success: true, data: list });
});

app.post('/api/v1-mock/judges', authenticateToken, (req, res) => {
  const { username, password, firstName, lastName, isActive } = req.body;

  if (db.judges.some(j => j.username === username)) {
    return res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_KEY",
        message: `Username '${username}' already exists`,
        details: []
      }
    });
  }

  const newJudge = {
    _id: generateId(),
    username,
    password,
    firstName,
    lastName,
    userType: "Judge",
    isActive: isActive !== undefined ? isActive : true
  };

  db.judges.push(newJudge);

  const { password: _, ...responseData } = newJudge;
  return res.status(201).json({
    success: true,
    message: "Judge created successfully",
    data: responseData
  });
});

app.put('/api/v1-mock/judges/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const index = db.judges.findIndex(j => j._id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: `Judge ID '${id}' not found`,
        details: []
      }
    });
  }

  const { username, password, firstName, lastName, isActive } = req.body;
  if (username) db.judges[index].username = username;
  if (password) db.judges[index].password = password;
  if (firstName) db.judges[index].firstName = firstName;
  if (lastName) db.judges[index].lastName = lastName;
  if (isActive !== undefined) db.judges[index].isActive = isActive;

  const { password: _, ...responseData } = db.judges[index];
  return res.status(200).json({
    success: true,
    message: "Judge updated successfully",
    data: responseData
  });
});

app.delete('/api/v1-mock/judges/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const index = db.judges.findIndex(j => j._id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: `Judge ID '${id}' not found`,
        details: []
      }
    });
  }

  db.judges.splice(index, 1);
  return res.status(200).json({
    success: true,
    message: "Judge deleted successfully"
  });
});

// 4. CATEGORIES & RUBRICS MODULE
app.get('/api/v1-mock/categories', authenticateToken, (req, res) => {
  return res.status(200).json({ success: true, data: db.categories });
});

app.post('/api/v1-mock/categories', authenticateToken, (req, res) => {
  const { name, description, weight, isActive, rubrics } = req.body;

  if (weight < 0 || weight > 100) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Category weight must be between 0 and 100",
        details: [{ field: "weight", issue: `Value ${weight} exceeds limits` }]
      }
    });
  }

  const newCategory = {
    _id: generateId(),
    name,
    description,
    weight,
    isActive: isActive !== undefined ? isActive : true,
    rubrics: (rubrics || []).map(r => ({
      _id: generateId(),
      name: r.name,
      maxPoints: r.maxPoints
    }))
  };

  db.categories.push(newCategory);
  return res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: newCategory
  });
});

app.put('/api/v1-mock/categories/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const category = db.categories.find(c => c._id === id);

  if (!category) {
    return res.status(404).json({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: `Category ID '${id}' not found`,
        details: []
      }
    });
  }

  const { name, description, weight, isActive, rubrics } = req.body;
  if (name) category.name = name;
  if (description !== undefined) category.description = description;
  if (weight !== undefined) category.weight = weight;
  if (isActive !== undefined) category.isActive = isActive;
  if (rubrics) {
    category.rubrics = rubrics.map(r => ({
      _id: r._id || generateId(),
      name: r.name,
      maxPoints: r.maxPoints
    }));
  }

  return res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: category
  });
});

app.delete('/api/v1-mock/categories/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const index = db.categories.findIndex(c => c._id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: `Category ID '${id}' not found`,
        details: []
      }
    });
  }

  db.categories.splice(index, 1);
  return res.status(200).json({
    success: true,
    message: "Category deleted successfully"
  });
});

// 5. CONTESTANT GROUPS MODULE
app.get('/api/v1-mock/contestant-groups', authenticateToken, (req, res) => {
  return res.status(200).json({ success: true, data: db.contestantGroups });
});

app.post('/api/v1-mock/contestant-groups', authenticateToken, (req, res) => {
  const { name, categoriesIncluded } = req.body;

  const newGroup = {
    _id: generateId(),
    name,
    categoriesIncluded: categoriesIncluded || []
  };

  db.contestantGroups.push(newGroup);
  return res.status(201).json({
    success: true,
    message: "Contestant group created successfully",
    data: newGroup
  });
});

app.put('/api/v1-mock/contestant-groups/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const group = db.contestantGroups.find(g => g._id === id);

  if (!group) {
    return res.status(404).json({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "Contestant group not found",
        details: []
      }
    });
  }

  const { name, categoriesIncluded } = req.body;
  if (name) group.name = name;
  if (categoriesIncluded) group.categoriesIncluded = categoriesIncluded;

  return res.status(200).json({
    success: true,
    message: "Contestant group updated successfully",
    data: group
  });
});

app.delete('/api/v1-mock/contestant-groups/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const index = db.contestantGroups.findIndex(g => g._id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "Contestant group not found",
        details: []
      }
    });
  }

  db.contestantGroups.splice(index, 1);
  return res.status(200).json({
    success: true,
    message: "Contestant group deleted successfully"
  });
});

// 6. CONTESTANTS MODULE
app.get('/api/v1-mock/contestants', authenticateToken, (req, res) => {
  const { groupId } = req.query;
  let list = db.contestants;

  if (groupId) {
    list = list.filter(c => c.group === groupId);
  }

  const responseData = list.map(c => {
    const g = db.contestantGroups.find(group => group._id === c.group);
    return {
      _id: c._id,
      name: c.name,
      label: c.label,
      image: c.image,
      group: {
        _id: g ? g._id : c.group,
        name: g ? g.name : "Unknown"
      }
    };
  });

  return res.status(200).json({ success: true, data: responseData });
});

app.post('/api/v1-mock/contestants', authenticateToken, (req, res) => {
  const { name, label, image, group } = req.body;

  if (!name || !group) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Missing required fields",
        details: [
          ...(!name ? [{ field: "name", issue: "Contestant name is required" }] : []),
          ...(!group ? [{ field: "group", issue: "Target contestant group is required" }] : [])
        ]
      }
    });
  }

  const newContestant = {
    _id: generateId(),
    name,
    label,
    image,
    group
  };

  db.contestants.push(newContestant);
  return res.status(201).json({
    success: true,
    message: "Contestant created successfully",
    data: newContestant
  });
});

app.put('/api/v1-mock/contestants/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const contestant = db.contestants.find(c => c._id === id);

  if (!contestant) {
    return res.status(404).json({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: `Contestant ID '${id}' not found`,
        details: []
      }
    });
  }

  const { name, label, image, group } = req.body;
  if (name) contestant.name = name;
  if (label) contestant.label = label;
  if (image) contestant.image = image;
  if (group) contestant.group = group;

  return res.status(200).json({
    success: true,
    message: "Contestant updated successfully",
    data: contestant
  });
});

app.delete('/api/v1-mock/contestants/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const index = db.contestants.findIndex(c => c._id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "Contestant not found",
        details: []
      }
    });
  }

  db.contestants.splice(index, 1);
  return res.status(200).json({
    success: true,
    message: "Contestant deleted successfully"
  });
});

// 7. JUDGE SCORING & LIVE PORTAL MODULE
app.get('/api/v1-mock/scores/live-sheet', authenticateToken, (req, res) => {
  const { categoryActive, contestantActive } = db.configuration.liveStatus;

  if (!categoryActive || !contestantActive) {
    return res.status(404).json({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "No active category or active contestant set in Live Status",
        details: []
      }
    });
  }

  const category = db.categories.find(c => c._id === categoryActive._id);
  const contestant = db.contestants.find(c => c._id === contestantActive._id);
  const group = db.contestantGroups.find(g => g._id === (contestant ? contestant.group : ''));

  const existingScoreEntry = db.scores.find(s =>
    s.judgeId === req.user._id &&
    s.categoryId === categoryActive._id &&
    s.contestantId === contestantActive._id
  );

  return res.status(200).json({
    success: true,
    data: {
      category: category ? [category] : [],
      contestant: contestant ? {
        _id: contestant._id,
        name: contestant.name,
        label: contestant.label,
        group: group ? group.name : "",
        image: contestant.image
      } : null,
      existingScores: existingScoreEntry ? existingScoreEntry.rubricsScore : []
    }
  });
});

app.post('/api/v1-mock/scores/submit', authenticateToken, (req, res) => {
  const { categoryId, contestantId, rubricsScore } = req.body;
  const judgeId = req.user._id;

  const category = db.categories.find(c => c._id === categoryId);
  if (category && rubricsScore) {
    for (const item of rubricsScore) {
      const rubric = category.rubrics.find(r => r._id === item.rubricsId);
      if (rubric && item.score > rubric.maxPoints) {
        return res.status(400).json({
          success: false,
          error: {
            code: "SCORE_EXCEEDS_MAX",
            message: `Score exceeds maximum points allowed for rubric '${rubric.name}'`,
            details: [{ rubricsId: item.rubricsId, givenScore: item.score, maxPoints: rubric.maxPoints }]
          }
        });
      }
    }
  }

  let scoreEntry = db.scores.find(s =>
    s.judgeId === judgeId &&
    s.categoryId === categoryId &&
    s.contestantId === contestantId
  );

  if (scoreEntry) {
    scoreEntry.rubricsScore = rubricsScore;
  } else {
    scoreEntry = {
      _id: generateId(),
      judgeId,
      categoryId,
      contestantId,
      rubricsScore
    };
    db.scores.push(scoreEntry);
  }

  return res.status(200).json({
    success: true,
    message: "Scores saved successfully",
    data: scoreEntry
  });
});

// 8. REPORTS MODULE
app.get('/api/v1-mock/reports/voting-progress', authenticateToken, (req, res) => {
  const judgesList = db.judges.filter(j => j.userType === 'Judge');
  const totalPossibleScores = db.categories.length * db.contestants.length;

  const data = judgesList.map(j => {
    const submittedScoresCount = db.scores.filter(s => s.judgeId === j._id).length;
    const progressPercentage = totalPossibleScores > 0
      ? Math.min(100, Number(((submittedScoresCount / totalPossibleScores) * 100).toFixed(1)))
      : 0.0;

    return {
      judgeId: j._id,
      judgeName: `${j.firstName} ${j.lastName}`,
      progressPercentage
    };
  });

  return res.status(200).json({ success: true, data });
});

app.get('/api/v1-mock/reports/final-rankings', authenticateToken, (req, res) => {
  const { groupId } = req.query;
  const group = db.contestantGroups.find(g => g._id === groupId);

  const groupContestants = db.contestants.filter(c => !groupId || c.group === groupId);

  const rankings = groupContestants.map(c => {
    let final_candidate_score = 0;
    const categoryScores = db.categories.map(cat => {
      const contestantScoresForCategory = db.scores.filter(s => s.contestantId === c._id && s.categoryId === cat._id);

      let avgRawScore = 0;
      if (contestantScoresForCategory.length > 0) {
        const totalRubricsSum = contestantScoresForCategory.reduce((acc, curr) => {
          return acc + curr.rubricsScore.reduce((rAcc, rCurr) => rAcc + rCurr.score, 0);
        }, 0);
        avgRawScore = totalRubricsSum / contestantScoresForCategory.length;
      }

      const weightedScore = avgRawScore * (cat.weight / 100);
      final_candidate_score += weightedScore;

      return {
        categoryName: cat.name,
        rawScore: Number(avgRawScore.toFixed(1)),
        weight: cat.weight,
        weightedScore: Number(weightedScore.toFixed(1))
      };
    });

    return {
      contestantId: c._id,
      name: c.name,
      label: c.label,
      categoryScores,
      final_candidate_score: Number(final_candidate_score.toFixed(1))
    };
  });

  rankings.sort((a, b) => b.final_candidate_score - a.final_candidate_score);
  const rankedData = rankings.map((item, idx) => ({ rank: idx + 1, ...item }));

  return res.status(200).json({
    success: true,
    data: {
      eventTitle: db.configuration.eventTitle,
      group: group ? group.name : "All Groups",
      rankings: rankedData
    }
  });
});

app.get('/api/v1-mock/reports/paper/final-ranking-sheet', authenticateToken, (req, res) => {
  const { groupId } = req.query;
  const group = db.contestantGroups.find(g => g._id === groupId);

  const groupContestants = db.contestants.filter(c => !groupId || c.group === groupId);

  const rows = groupContestants.map(c => {
    let final_candidate_score = 0;
    db.categories.forEach(cat => {
      const contestantScoresForCategory = db.scores.filter(s => s.contestantId === c._id && s.categoryId === cat._id);
      if (contestantScoresForCategory.length > 0) {
        const totalRubricsSum = contestantScoresForCategory.reduce((acc, curr) => {
          return acc + curr.rubricsScore.reduce((rAcc, rCurr) => rAcc + rCurr.score, 0);
        }, 0);
        const avgRawScore = totalRubricsSum / contestantScoresForCategory.length;
        final_candidate_score += avgRawScore * (cat.weight / 100);
      }
    });

    const contestantGroup = db.contestantGroups.find(g => g._id === c.group);

    return {
      nameAndLabel: `${c.label} - ${c.name}`,
      group: contestantGroup ? contestantGroup.name : "",
      final_candidate_score: Number(final_candidate_score.toFixed(1))
    };
  });

  rows.sort((a, b) => b.final_candidate_score - a.final_candidate_score);
  const rankedRows = rows.map((r, i) => ({ rank: i + 1, ...r }));

  return res.status(200).json({
    success: true,
    data: {
      header: {
        institution: "Jose Rizal Memorial State University",
        college: "College of Computing Studies",
        eventTitle: db.configuration.eventTitle
      },
      group: group ? group.name : "All Groups",
      rows: rankedRows
    }
  });
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;