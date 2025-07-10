import axios from "axios";
import adfToMd from "adf-to-md";

// --- Configuration ---
const JIRA_BASE_URL = "https://pentalinkss.atlassian.net"; // Your Jira Cloud URL
const JIRA_API_EMAIL = "korea.sesong@gmail.com"; // Your Jira email
const JIRA_API_TOKEN = "";

const ISSUETRACKER_API_BASE_URL = "http://localhost:3000/api"; // Your IssueTracker API URL
const ISSUETRACKER_ADMIN_USERID = "apadmin"; // IssueTracker admin username
const ISSUETRACKER_ADMIN_PASSWORD = "0000"; // IssueTracker admin password (CHANGE THIS IN PRODUCTION)

// --- Mappings (will be populated during migration) ---
const projectMap = new Map(); // Jira Project ID -> IssueTracker Project ID
const userMap = new Map(); // Jira Account ID -> IssueTracker User ID
const statusMap = new Map(); // Jira Status Name -> IssueTracker Status ID
const typeMap = new Map(); // Jira Type Name -> IssueTracker Type ID
const priorityMap = new Map(); // Jira Priority Name -> IssueTracker Priority ID

// --- Helper function for Jira API calls ---
const jiraApi = axios.create({
  baseURL: JIRA_BASE_URL,
  headers: {
    Authorization: `Basic ${Buffer.from(
      `${JIRA_API_EMAIL}:${JIRA_API_TOKEN}`
    ).toString("base64")}`,
    Accept: "application/json",
  },
});

// --- Helper function for IssueTracker API calls ---
import FormData from "form-data";

import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

const jar = new CookieJar();

// --- Helper function for IssueTracker API calls ---
const issueTrackerApi = wrapper(
  axios.create({
    baseURL: ISSUETRACKER_API_BASE_URL,
    withCredentials: true, // Important for sending/receiving session cookies
    jar, // Attach the cookie jar to the axios instance
  })
);

// --- IssueTracker Authentication ---
async function loginToIssueTracker() {
  console.log("Attempting to log in to IssueTracker as admin...");
  try {
    const response = await issueTrackerApi.post("/login", {
      userid: ISSUETRACKER_ADMIN_USERID,
      password: ISSUETRACKER_ADMIN_PASSWORD,
    });
    if (response.status === 200) {
      console.log("Successfully logged in to IssueTracker.");
      return true;
    }
  } catch (error) {
    console.error("Failed to log in to IssueTracker:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    return false;
  }
}

// --- ADF to Markdown Converter ---
function convertAdfToMarkdown(adfDoc) {
  if (!adfDoc) return "";
  try {
    const converted = adfToMd.convert(adfDoc);

    return converted?.result || "";
  } catch (e) {
    console.error("Error converting ADF to Markdown:", e);
    return ""; // Return empty string on error
  }
}

// --- Status Mapping Helper ---
function mapJiraStatusToIssueTrackerStatus(jiraStatusName) {
  const mapping = {
    // --- Mappings for Korean Jira Statuses ---
    완료: "닫힘",
    해결됨: "수정 완료",
    "진행 중": "수정 중",
    "할 일": "열림",

    // --- Mappings for English Jira Statuses ---
    Done: "닫힘",
    Closed: "닫힘",
    Resolved: "수정 완료",
    "In Progress": "수정 중",
    "To Do": "열림",
    Open: "열림",
    Reopened: "열림",
    Verified: "검증",
    Rejected: "원치 않음",
  };
  return mapping[jiraStatusName] || jiraStatusName; // Fallback to original name if no mapping found
}

// --- IssueTracker Helpers ---
async function getOrCreateIssueTrackerProject(jiraProject) {
  const existingProjectId = projectMap.get(jiraProject.id);
  if (existingProjectId) {
    return existingProjectId;
  }

  try {
    // Try to find by key first
    const response = await issueTrackerApi.get(
      `/projects?key=${jiraProject.key}`
    );
    if (response.data && response.data.length > 0) {
      const issueTrackerProject = response.data[0];
      projectMap.set(jiraProject.id, issueTrackerProject.id);
      console.log(
        `Mapped existing IssueTracker project: ${jiraProject.name} -> ${issueTrackerProject.name}`
      );
      return issueTrackerProject.id;
    }
  } catch (error) {
    console.error("Error checking for existing IssueTracker project:", error);
    // Not found, proceed to create
  }

  // Create new project
  console.log(
    `Creating new IssueTracker project: ${jiraProject.name} (${jiraProject.key})`
  );
  try {
    const newProjectResponse = await issueTrackerApi.post("/projects", {
      name: jiraProject.name,
      key: jiraProject.key,
      // Add other default project settings if needed
    });
    const newProjectId = newProjectResponse.data.id;
    projectMap.set(jiraProject.id, newProjectId);
    return newProjectId;
  } catch (error) {
    console.error(
      `Failed to create IssueTracker project ${jiraProject.name} (${jiraProject.key}):`,
      error.message
    );
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error; // Re-throw to be caught by the main migration function
  }
}

async function getOrCreateIssueTrackerUser(jiraUser) {
  if (!jiraUser || !jiraUser.accountId) {
    return null; // Handle unassigned or invalid users
  }

  const existingUserId = userMap.get(jiraUser.accountId);
  if (existingUserId) {
    return existingUserId;
  }

  try {
    // Try to find by username (displayName) first
    const response = await issueTrackerApi.get(
      `/users?username=${jiraUser.displayName}`
    );
    if (response.data && response.data.length > 0) {
      const issueTrackerUser = response.data[0];
      userMap.set(jiraUser.accountId, issueTrackerUser.userid);
      console.log(
        `Mapped existing IssueTracker user: ${jiraUser.displayName} -> ${issueTrackerUser.username}`
      );
      return issueTrackerUser.userid;
    }
  } catch (error) {
    // Not found, proceed to create (or use a default user)
  }

  // For simplicity, let's assume we create a new user or map to a default one.
  // In a real scenario, you might want to prompt for mapping or use a specific default.
  console.log(
    `Creating placeholder IssueTracker user for: ${jiraUser.displayName} (${jiraUser.accountId})`
  );
  // This is a simplified user creation. IssueTracker might require more fields (password, email).
  // You might need to adjust this based on your IssueTracker's user creation API.
  const newUserData = {
    userid: jiraUser.accountId, // Using Jira accountId as IssueTracker userid for uniqueness
    username: jiraUser.displayName,
    email: `${jiraUser.accountId}@migrated.jira`, // Placeholder email
    password: "migratedUser123!", // Placeholder password - MUST BE CHANGED IN REAL SCENARIO
  };
  const newUserResponse = await issueTrackerApi.post("/register", newUserData);
  const newUserId = newUserResponse.data.userid;
  userMap.set(jiraUser.accountId, newUserId);
  return newUserId;
}

// --- Metadata Mapping Helpers ---
async function populateMetadataMaps(issueTrackerProjectId) {
  console.log(
    `Populating IssueTracker metadata maps for project ${issueTrackerProjectId}...`
  );
  try {
    const response = await issueTrackerApi.get(
      `/projects/${issueTrackerProjectId}/issue-settings`
    );
    const { statuses, types, priorities } = response.data;

    statuses.forEach((s) => statusMap.set(s.name, s.id));
    types.forEach((t) => typeMap.set(t.name, t.id));
    priorities.forEach((p) => priorityMap.set(p.name, p.id));

    console.log("Metadata maps populated.");
  } catch (error) {
    console.error(
      `Failed to populate metadata maps for project ${issueTrackerProjectId}:`,
      error.message
    );
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    throw error; // Re-throw to stop migration if metadata cannot be fetched
  }
}

// --- Issue Processing ---
async function processJiraIssue(jiraIssue) {
  // 1. Get or Create Project
  const issueTrackerProjectId = await getOrCreateIssueTrackerProject(
    jiraIssue.fields.project
  );

  // 2. Get or Create Reporter
  const reporterUserId = await getOrCreateIssueTrackerUser(
    jiraIssue.fields.reporter
  );

  // 3. Get or Create Assignee (if exists)
  let assigneeUserId = null;
  if (jiraIssue.fields.assignee) {
    assigneeUserId = await getOrCreateIssueTrackerUser(
      jiraIssue.fields.assignee
    );
  }

  // 4. Convert Description (ADF to Markdown)
  const markdownDescription = String(
    convertAdfToMarkdown(jiraIssue.fields.description) || ""
  ); // Ensure it's a string

  // 5. Map other fields to IssueTracker's IssueFormData
  const issueTrackerStatusName = mapJiraStatusToIssueTrackerStatus(
    jiraIssue.fields.status.name
  );
  const issueFormData = {
    projectId: issueTrackerProjectId,
    title: String(jiraIssue.fields.summary || ""), // Ensure title is a string
    content: markdownDescription,
    reporter: String(reporterUserId || ""), // Ensure reporter is a string
    assignee: assigneeUserId,
    type:
      typeMap.get(jiraIssue.fields.issuetype.name) ||
      jiraIssue.fields.issuetype.name, // Use mapped ID, fallback to name
    priority:
      priorityMap.get(jiraIssue.fields.priority.name) ||
      jiraIssue.fields.priority.name, // Use mapped ID, fallback to name
    status: statusMap.get(issueTrackerStatusName), // Use mapped ID
    createdAt: jiraIssue.fields.created, // Pass original creation time
    updatedAt: jiraIssue.fields.updated, // Pass original update time
  };

  // 7. Process and add full history
  const history = [
    {
      userId: reporterUserId,
      action: "created",
      timestamp: jiraIssue.fields.created,
    },
  ];

  if (jiraIssue.changelog && jiraIssue.changelog.histories) {
    for (const change of jiraIssue.changelog.histories) {
      const authorId = await getOrCreateIssueTrackerUser(change.author);
      for (const item of change.items) {
        history.push({
          userId: authorId,
          action: `updated - ${item.field}`,
          timestamp: change.created,
          from: item.fromString,
          to: item.toString,
        });
      }
    }
  }
  issueFormData.history = history.sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  // 8. Create Issue in IssueTracker
  const formData = new FormData();

  // Convert history array to JSON string before appending
  if (issueFormData.history) {
    issueFormData.history = JSON.stringify(issueFormData.history);
  }

  for (const key in issueFormData) {
    const value = issueFormData[key];
    if (value !== undefined && value !== null) {
      formData.append(key, String(value)); // Ensure all appended values are strings
    }
  }

  try {
    const newIssueResponse = await issueTrackerApi.post("/issues", formData, {
      headers: formData.getHeaders(), // Important for multipart/form-data
    });
    console.log(
      `Successfully created IssueTracker issue: ${newIssueResponse.data.issueKey}`
    );
    // Store mapping if needed: Jira Issue ID -> IssueTracker Issue ID
    const issueTrackerIssueId = newIssueResponse.data.id;

    // 7. Migrate Comments
    if (jiraIssue.fields.comment && jiraIssue.fields.comment.comments) {
      for (const jiraComment of jiraIssue.fields.comment.comments) {
        const commentAuthorId = await getOrCreateIssueTrackerUser(
          jiraComment.author
        );
        if (commentAuthorId) {
          try {
            await issueTrackerApi.post(
              `/issues/${issueTrackerIssueId}/comments`,
              {
                text: convertAdfToMarkdown(jiraComment.body),
                userId: commentAuthorId,
                createdAt: jiraComment.created,
                isMigration: true, // 마이그레이션 모드 플래그 추가
              }
            );
            console.log(
              `  -> Migrated comment by ${jiraComment.author.displayName} on ${jiraComment.created}`
            );
          } catch (commentError) {
            console.error(
              `    Failed to migrate comment for issue ${jiraIssue.key}:`,
              commentError.message
            );
          }
        }
      }
    }

    // 8. Migrate Attachments
    if (jiraIssue.fields.attachment && jiraIssue.fields.attachment.length > 0) {
      for (const jiraAttachment of jiraIssue.fields.attachment) {
        try {
          // Download the attachment from Jira
          const attachmentResponse = await jiraApi.get(jiraAttachment.content, {
            responseType: "arraybuffer", // Important for binary files
          });

          // Prepare form data to upload to IssueTracker
          const attachmentFormData = new FormData();
          attachmentFormData.append("files", attachmentResponse.data, {
            filename: jiraAttachment.filename,
          });

          attachmentFormData.append("isMigration", "true"); // 마이그레이션 모드 플래그

          // Upload to IssueTracker
          await issueTrackerApi.put(
            `/issues/${issueTrackerIssueId}`,
            attachmentFormData,
            {
              headers: attachmentFormData.getHeaders(),
            }
          );
          console.log(`  -> Migrated attachment: ${jiraAttachment.filename}`);
        } catch (attachmentError) {
          console.error(
            `    Failed to migrate attachment ${jiraAttachment.filename}:`,
            attachmentError.message
          );
        }
      }
    }
  } catch (error) {
    console.error(
      `Failed to create IssueTracker issue for Jira issue ${jiraIssue.key}:`,
      error.message
    );
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

// --- Main Migration Function ---
async function migrateJiraIssues() {
  console.log("Starting Jira issue migration...");

  try {
    const loggedIn = await loginToIssueTracker();
    if (!loggedIn) {
      console.error("Aborting migration due to failed IssueTracker login.");
      return;
    }
    // 1. Migrate Projects
    console.log("Migrating Jira projects...");
    const jiraProjectsResponse = await jiraApi.get("/rest/api/3/project");
    let firstIssueTrackerProjectId = null;
    for (const jiraProject of jiraProjectsResponse.data) {
      const issueTrackerProjectId = await getOrCreateIssueTrackerProject(
        jiraProject
      );
      if (!firstIssueTrackerProjectId) {
        firstIssueTrackerProjectId = issueTrackerProjectId;
      }
    }
    console.log(`Migrated ${projectMap.size} projects.`);

    // Ensure at least one project was migrated to fetch metadata
    if (!firstIssueTrackerProjectId) {
      console.error(
        "No projects migrated. Cannot populate metadata maps. Aborting."
      );
      return;
    }

    // 2. Migrate Users (This is a simplified approach. A full migration would involve fetching all users from Jira's user API)
    // For now, we'll rely on users being created on demand when issues are migrated.
    console.log("User migration will happen on demand during issue migration.");

    // 3. Populate Metadata Maps
    await populateMetadataMaps(firstIssueTrackerProjectId);

    // 4. Migrate Issues
    console.log("Migrating Jira issues...");
    let startAt = 0;
    const maxResults = 50; // Fetch 50 issues at a time

    while (true) {
      const searchResponse = await jiraApi.post("/rest/api/3/search", {
        jql: "ORDER BY created ASC", // Order by creation date to ensure consistent pagination
        startAt: startAt,
        maxResults: maxResults,
        fields: [
          // Specify fields to retrieve to reduce payload size
          "summary",
          "description",
          "issuetype",
          "priority",
          "status",
          "reporter",
          "assignee",
          "created",
          "updated",
          "project",
          "attachment",
          "comment",
          "fixVersions",
          "versions",
          "components",
          // Add any custom fields you need to migrate, e.g., 'customfield_10001'
        ],
      });

      const issues = searchResponse.data.issues;
      if (issues.length === 0) {
        break; // No more issues
      }

      for (const jiraIssue of issues) {
        // 위의 search api에서는 json 크기 때문인지 changelog값이 들어오지 않는다.
        // 그래서 별도로 해당 이슈키로 changelog를 가져온다.
        const issueResponse = await jiraApi.get(
          `/rest/api/3/issue/${jiraIssue.key}`,
          {
            params: {
              expand: "changelog",
            },
          }
        );
        jiraIssue.changelog = issueResponse.data.changelog; // Attach changelog to the issue
        await processJiraIssue(jiraIssue);
      }

      startAt += issues.length;
      if (startAt >= searchResponse.data.total) {
        break; // All issues processed
      }
    }
    console.log("All Jira issues processed.");

    console.log("Migration process completed.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }
  }
}

// --- Run the migration ---
migrateJiraIssues();
