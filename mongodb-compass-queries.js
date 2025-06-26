// MongoDB Compass Test Queries
// Use these individual queries in MongoDB Compass to test your database

// =====================================================
// SAMPLE DATA INSERTION (Run once to set up test data)
// =====================================================

// Insert test user
db.users.insertOne({
  _id: "test_user_1",
  github_id: "12345",
  username: "johndoe",
  email: "john@example.com", 
  avatar_url: "https://github.com/johndoe.png",
  access_token: "ghp_test_token",
  created_at: new Date(),
  updated_at: new Date()
});

// Insert test repository
db.repositories.insertOne({
  _id: "test_repo_1",
  user_id: "test_user_1",
  repo_name: "awesome-app",
  repo_full_name: "johndoe/awesome-app",
  repo_url: "https://github.com/johndoe/awesome-app",
  github_repo_id: 123456789,
  default_branch: "main",
  is_private: false,
  connected_at: new Date(),
  last_sync_at: new Date()
});

// =====================================================
// BASIC QUERIES
// =====================================================

// 1. Find user by GitHub ID
db.users.findOne({ github_id: "12345" });

// 2. Find user by email
db.users.findOne({ email: "john@example.com" });

// 3. Get all repositories for a user
db.repositories.find({ user_id: "test_user_1" });

// 4. Count total users
db.users.countDocuments();

// 5. Count total repositories
db.repositories.countDocuments();

// =====================================================
// USER OPERATIONS
// =====================================================

// Find or update user (upsert simulation)
db.users.findOneAndUpdate(
  { github_id: "12345" },
  {
    $set: {
      username: "johndoe_updated",
      avatar_url: "https://github.com/johndoe-new.png",
      updated_at: new Date()
    }
  },
  { upsert: true, returnDocument: "after" }
);

// Get user with repository count
db.users.aggregate([
  { $match: { _id: "test_user_1" } },
  {
    $lookup: {
      from: "repositories",
      localField: "_id",
      foreignField: "user_id", 
      as: "repositories"
    }
  },
  {
    $addFields: {
      repositoryCount: { $size: "$repositories" }
    }
  },
  {
    $project: {
      github_id: 1,
      username: 1,
      email: 1,
      repositoryCount: 1,
      created_at: 1
    }
  }
]);

// =====================================================
// REPOSITORY OPERATIONS  
// =====================================================

// Update repository sync time
db.repositories.updateOne(
  { _id: "test_repo_1" },
  { $set: { last_sync_at: new Date() } }
);

// Get repositories with stats
db.repositories.aggregate([
  {
    $lookup: {
      from: "changelogs",
      localField: "_id",
      foreignField: "repo_id",
      as: "changelogs"
    }
  },
  {
    $lookup: {
      from: "commits", 
      localField: "_id",
      foreignField: "repo_id",
      as: "commits"
    }
  },
  {
    $addFields: {
      changelogCount: { $size: "$changelogs" },
      commitCount: { $size: "$commits" }
    }
  },
  {
    $project: {
      repo_name: 1,
      repo_full_name: 1,
      is_private: 1,
      connected_at: 1,
      last_sync_at: 1,
      changelogCount: 1,
      commitCount: 1
    }
  }
]);

// =====================================================
// SEARCH QUERIES
// =====================================================

// Search repositories by name (case-insensitive)
db.repositories.find({ 
  repo_name: { $regex: "awesome", $options: "i" } 
});

// Get all private repositories
db.repositories.find({ is_private: true });

// Get users created in the last 7 days
db.users.find({
  created_at: {
    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
});

// =====================================================
// DASHBOARD QUERIES
// =====================================================

// Get complete user dashboard data
db.users.aggregate([
  { $match: { _id: "test_user_1" } },
  {
    $lookup: {
      from: "repositories",
      localField: "_id",
      foreignField: "user_id",
      as: "repositories"
    }
  },
  {
    $lookup: {
      from: "changelogs",
      let: { repoIds: "$repositories._id" },
      pipeline: [
        { $match: { $expr: { $in: ["$repo_id", "$$repoIds"] } } },
        { $sort: { created_at: -1 } },
        { $limit: 5 }
      ],
      as: "recentChangelogs"
    }
  },
  {
    $addFields: {
      repositoryCount: { $size: "$repositories" },
      privateRepoCount: {
        $size: {
          $filter: {
            input: "$repositories",
            cond: { $eq: ["$$this.is_private", true] }
          }
        }
      },
      totalChangelogs: { $size: "$recentChangelogs" }
    }
  },
  {
    $project: {
      github_id: 1,
      username: 1,
      email: 1,
      avatar_url: 1,
      repositoryCount: 1,
      privateRepoCount: 1,
      totalChangelogs: 1,
      created_at: 1,
      repositories: {
        $slice: ["$repositories", 3] // Show only first 3 repos
      }
    }
  }
]);

// =====================================================
// DATA INTEGRITY CHECKS
// =====================================================

// Check for users without repositories
db.users.aggregate([
  {
    $lookup: {
      from: "repositories",
      localField: "_id",
      foreignField: "user_id", 
      as: "repositories"
    }
  },
  { $match: { repositories: { $size: 0 } } },
  { $project: { username: 1, email: 1, created_at: 1 } }
]);

// Check for duplicate GitHub IDs
db.users.aggregate([
  { $group: { _id: "$github_id", count: { $sum: 1 }, users: { $push: "$username" } } },
  { $match: { count: { $gt: 1 } } }
]);

// =====================================================
// INDEX TESTING
// =====================================================

// Test index performance - these will show if indexes are being used
db.users.find({ github_id: "12345" }).explain("executionStats");
db.users.find({ email: "john@example.com" }).explain("executionStats");
db.repositories.find({ user_id: "test_user_1" }).explain("executionStats");

// =====================================================
// CLEANUP (Run to remove test data)
// =====================================================

// Remove test data
db.users.deleteMany({ _id: { $regex: "^test_" } });
db.repositories.deleteMany({ _id: { $regex: "^test_" } });
db.changelogs.deleteMany({ _id: { $regex: "^test_" } });
db.commits.deleteMany({ _id: { $regex: "^test_" } }); 