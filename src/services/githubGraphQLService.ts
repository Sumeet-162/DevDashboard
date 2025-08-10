import { githubAuthService } from './githubAuthService';

interface ContributionDay {
  contributionCount: number;
  date: string;
  contributionLevel: 'NONE' | 'FIRST_QUARTILE' | 'SECOND_QUARTILE' | 'THIRD_QUARTILE' | 'FOURTH_QUARTILE';
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface ContributionsCollection {
  contributionCalendar: {
    totalContributions: number;
    weeks: ContributionWeek[];
  };
  contributionYears: {
    year: number;
    totalContributions: number;
  }[];
  user: {
    contributionsCollection: {
      hasAnyContributions: boolean;
    };
  };
}

class GitHubGraphQLService {
  private readonly graphqlEndpoint = 'https://api.github.com/graphql';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes for real data
  
  // Rate limiting
  private rateLimitRemaining = 5000;
  private rateLimitResetTime = 0;

  // GraphQL query for contributions
  private readonly contributionsQuery = `
    query GetUserContributions($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                contributionLevel
              }
            }
          }
          hasAnyContributions
          hasAnyRestrictedContributions
          restrictedContributionsCount
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalRepositoryContributions
        }
        login
        name
      }
      rateLimit {
        remaining
        resetAt
        cost
      }
    }
  `;

  private async makeGraphQLRequest(query: string, variables: any) {
    const token = githubAuthService.getAccessToken();
    if (!token) {
      throw new Error('GitHub authentication required for real contribution data');
    }

    // Check rate limit
    if (this.rateLimitRemaining < 50 && Date.now() < this.rateLimitResetTime) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    }

    try {
      const response = await fetch(this.graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await githubAuthService.signOut();
          throw new Error('GitHub token expired. Please re-authenticate.');
        }
        throw new Error(`GitHub GraphQL API error: ${response.status}`);
      }

      const data = await response.json();

      // Update rate limit info
      if (data.data?.rateLimit) {
        this.rateLimitRemaining = data.data.rateLimit.remaining;
        this.rateLimitResetTime = new Date(data.data.rateLimit.resetAt).getTime();
      }

      if (data.errors) {
        throw new Error(`GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`);
      }

      return data.data;
    } catch (error) {
      console.error('GitHub GraphQL request failed:', error);
      throw error;
    }
  }

  async getRealContributions(username: string) {
    // Check cache first
    const cacheKey = `contributions_${username}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Calculate date range for last year
      const to = new Date();
      const from = new Date(to.getTime() - 365 * 24 * 60 * 60 * 1000);

      const data = await this.makeGraphQLRequest(this.contributionsQuery, {
        username,
        from: from.toISOString(),
        to: to.toISOString(),
      });

      if (!data.user) {
        throw new Error(`GitHub user '${username}' not found`);
      }

      const contributionsData = this.processContributionData(data.user.contributionsCollection);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: contributionsData,
        timestamp: Date.now(),
      });

      return contributionsData;
    } catch (error) {
      console.error('Error fetching real contributions:', error);
      throw error;
    }
  }

  private processContributionData(contributionsCollection: any) {
    const contributions = [];
    const weeks = contributionsCollection.contributionCalendar.weeks;

    // Process each week and day
    for (const week of weeks) {
      for (const day of week.contributionDays) {
        const level = this.convertContributionLevel(day.contributionLevel);
        contributions.push({
          date: day.date,
          count: day.contributionCount,
          level,
        });
      }
    }

    // Calculate streaks
    const currentStreak = this.calculateCurrentStreak(contributions);
    const longestStreak = this.calculateLongestStreak(contributions);

    return {
      contributions,
      totalContributions: contributionsCollection.contributionCalendar.totalContributions,
      currentStreak,
      longestStreak,
      hasAnyContributions: contributionsCollection.hasAnyContributions,
      breakdownStats: {
        commits: contributionsCollection.totalCommitContributions,
        pullRequests: contributionsCollection.totalPullRequestContributions,
        issues: contributionsCollection.totalIssueContributions,
        reviews: contributionsCollection.totalPullRequestReviewContributions,
        repositories: contributionsCollection.totalRepositoryContributions,
      },
    };
  }

  private convertContributionLevel(level: string): number {
    switch (level) {
      case 'NONE': return 0;
      case 'FIRST_QUARTILE': return 1;
      case 'SECOND_QUARTILE': return 2;
      case 'THIRD_QUARTILE': return 3;
      case 'FOURTH_QUARTILE': return 4;
      default: return 0;
    }
  }

  private calculateCurrentStreak(contributions: any[]): number {
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    // Start from today and work backwards
    for (let i = contributions.length - 1; i >= 0; i--) {
      const contribution = contributions[i];
      if (contribution.date > today) continue; // Skip future dates
      
      if (contribution.count > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private calculateLongestStreak(contributions: any[]): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (const day of contributions) {
      if (day.count > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return maxStreak;
  }

  // Get rate limit status
  getRateLimitStatus() {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: new Date(this.rateLimitResetTime),
      isLimited: this.rateLimitRemaining < 50 && Date.now() < this.rateLimitResetTime,
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get additional user stats via GraphQL
  async getDetailedUserStats(username: string) {
    const cacheKey = `detailed_stats_${username}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const query = `
      query GetDetailedUserStats($username: String!) {
        user(login: $username) {
          repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC) {
            totalCount
            nodes {
              stargazerCount
              forkCount
              primaryLanguage {
                name
                color
              }
              createdAt
              updatedAt
              isPrivate
              isFork
            }
          }
          followers {
            totalCount
          }
          following {
            totalCount
          }
          gists {
            totalCount
          }
          issues {
            totalCount
          }
          pullRequests {
            totalCount
          }
          repositoriesContributedTo {
            totalCount
          }
        }
        rateLimit {
          remaining
          resetAt
          cost
        }
      }
    `;

    try {
      const data = await this.makeGraphQLRequest(query, { username });
      
      const processedStats = {
        totalRepos: data.user.repositories.totalCount,
        totalStars: data.user.repositories.nodes.reduce(
          (sum: number, repo: any) => sum + repo.stargazerCount, 0
        ),
        totalForks: data.user.repositories.nodes.reduce(
          (sum: number, repo: any) => sum + repo.forkCount, 0
        ),
        followers: data.user.followers.totalCount,
        following: data.user.following.totalCount,
        gists: data.user.gists.totalCount,
        issues: data.user.issues.totalCount,
        pullRequests: data.user.pullRequests.totalCount,
        contributedTo: data.user.repositoriesContributedTo.totalCount,
        languages: this.processLanguageStats(data.user.repositories.nodes),
      };

      this.cache.set(cacheKey, {
        data: processedStats,
        timestamp: Date.now(),
      });

      return processedStats;
    } catch (error) {
      console.error('Error fetching detailed user stats:', error);
      throw error;
    }
  }

  // Get real Pull Requests data
  async getUserPullRequests(username: string, limit: number = 20) {
    const cacheKey = `pull_requests_${username}_${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const query = `
      query GetUserPullRequests($username: String!, $limit: Int!) {
        user(login: $username) {
          pullRequests(first: $limit, orderBy: {field: CREATED_AT, direction: DESC}) {
            totalCount
            nodes {
              id
              title
              number
              state
              createdAt
              updatedAt
              mergedAt
              closedAt
              url
              repository {
                name
                nameWithOwner
                owner {
                  login
                }
              }
              author {
                login
              }
              mergeable
              reviewDecision
              additions
              deletions
              changedFiles
              labels(first: 10) {
                nodes {
                  name
                  color
                }
              }
            }
          }
        }
        rateLimit {
          remaining
          resetAt
          cost
        }
      }
    `;

    try {
      const data = await this.makeGraphQLRequest(query, { username, limit });
      
      const processedPRs = {
        totalCount: data.user.pullRequests.totalCount,
        pullRequests: data.user.pullRequests.nodes.map((pr: any) => ({
          id: pr.id,
          number: pr.number,
          title: pr.title,
          state: pr.state,
          createdAt: pr.createdAt,
          updatedAt: pr.updatedAt,
          mergedAt: pr.mergedAt,
          closedAt: pr.closedAt,
          url: pr.url,
          repository: {
            name: pr.repository.name,
            nameWithOwner: pr.repository.nameWithOwner,
            owner: pr.repository.owner.login,
          },
          author: pr.author?.login,
          mergeable: pr.mergeable,
          reviewDecision: pr.reviewDecision,
          additions: pr.additions,
          deletions: pr.deletions,
          changedFiles: pr.changedFiles,
          labels: pr.labels.nodes.map((label: any) => ({
            name: label.name,
            color: label.color,
          })),
        })),
      };

      this.cache.set(cacheKey, {
        data: processedPRs,
        timestamp: Date.now(),
      });

      return processedPRs;
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      throw error;
    }
  }

  // Get real Issues data
  async getUserIssues(username: string, limit: number = 20) {
    const cacheKey = `issues_${username}_${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const query = `
      query GetUserIssues($username: String!, $limit: Int!) {
        user(login: $username) {
          issues(first: $limit, orderBy: {field: CREATED_AT, direction: DESC}) {
            totalCount
            nodes {
              id
              title
              number
              state
              createdAt
              updatedAt
              closedAt
              url
              repository {
                name
                nameWithOwner
                owner {
                  login
                }
              }
              author {
                login
              }
              assignees(first: 5) {
                nodes {
                  login
                }
              }
              labels(first: 10) {
                nodes {
                  name
                  color
                }
              }
              comments {
                totalCount
              }
            }
          }
        }
        rateLimit {
          remaining
          resetAt
          cost
        }
      }
    `;

    try {
      const data = await this.makeGraphQLRequest(query, { username, limit });
      
      const processedIssues = {
        totalCount: data.user.issues.totalCount,
        issues: data.user.issues.nodes.map((issue: any) => ({
          id: issue.id,
          number: issue.number,
          title: issue.title,
          state: issue.state,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
          closedAt: issue.closedAt,
          url: issue.url,
          repository: {
            name: issue.repository.name,
            nameWithOwner: issue.repository.nameWithOwner,
            owner: issue.repository.owner.login,
          },
          author: issue.author?.login,
          assignees: issue.assignees.nodes.map((assignee: any) => assignee.login),
          labels: issue.labels.nodes.map((label: any) => ({
            name: label.name,
            color: label.color,
          })),
          commentCount: issue.comments.totalCount,
        })),
      };

      this.cache.set(cacheKey, {
        data: processedIssues,
        timestamp: Date.now(),
      });

      return processedIssues;
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }
  }

  private processLanguageStats(repositories: any[]) {
    const languages: Record<string, number> = {};
    
    repositories.forEach(repo => {
      if (repo.primaryLanguage) {
        const lang = repo.primaryLanguage.name;
        languages[lang] = (languages[lang] || 0) + 1;
      }
    });

    return languages;
  }
}

export const githubGraphQLService = new GitHubGraphQLService();
