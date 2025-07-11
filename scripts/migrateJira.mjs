import axios from "axios";
import adfToMd from "adf-to-md";
import { Buffer } from "buffer";

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
const projectMetadataMap = new Map(); // IssueTracker Project ID -> { statusMap, typeMap, priorityMap }

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
    console.log(
      `Looking for IssueTracker project with key: ${jiraProject.key}, name: ${jiraProject.name}`
    );

    // Try to find by key first
    const keyResponse = await issueTrackerApi.get(
      `/projects?key=${jiraProject.key}`
    );
    console.log(`Key search response:`, keyResponse.data);

    if (keyResponse.data && keyResponse.data.length > 0) {
      // 정확히 같은 키를 가진 프로젝트 찾기
      const exactKeyMatch = keyResponse.data.find(
        (p) => p.key === jiraProject.key
      );
      if (exactKeyMatch) {
        projectMap.set(jiraProject.id, exactKeyMatch.id);
        console.log(
          `✓ Mapped existing IssueTracker project by key: ${jiraProject.name} (${jiraProject.key}) -> ${exactKeyMatch.name} (${exactKeyMatch.key})`
        );
        return exactKeyMatch.id;
      }
    }

    // If not found by key, try to find by name
    console.log(`Key not found, searching by name: ${jiraProject.name}`);
    const nameResponse = await issueTrackerApi.get(
      `/projects?name=${jiraProject.name}`
    );
    console.log(`Name search response:`, nameResponse.data);

    if (nameResponse.data && nameResponse.data.length > 0) {
      // 정확히 같은 이름을 가진 프로젝트 찾기
      const exactNameMatch = nameResponse.data.find(
        (p) => p.name === jiraProject.name
      );
      if (exactNameMatch) {
        projectMap.set(jiraProject.id, exactNameMatch.id);
        console.log(
          `✓ Mapped existing IssueTracker project by name: ${jiraProject.name} -> ${exactNameMatch.name} (${exactNameMatch.key})`
        );
        return exactNameMatch.id;
      }
    }

    console.log(`No matching project found by key or name`);
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
async function getProjectMetadata(issueTrackerProjectId) {
  // 이미 캐시된 메타데이터가 있으면 반환
  if (projectMetadataMap.has(issueTrackerProjectId)) {
    return projectMetadataMap.get(issueTrackerProjectId);
  }

  console.log(
    `Loading metadata for IssueTracker project ${issueTrackerProjectId}...`
  );
  try {
    const response = await issueTrackerApi.get(
      `/projects/${issueTrackerProjectId}/issue-settings`
    );
    const { statuses, types, priorities } = response.data;

    const statusMap = new Map();
    const typeMap = new Map();
    const priorityMap = new Map();

    statuses.forEach((s) => statusMap.set(s.name, s.id));
    types.forEach((t) => typeMap.set(t.name, t.id));
    priorities.forEach((p) => priorityMap.set(p.name, p.id));

    const metadata = { statusMap, typeMap, priorityMap };
    projectMetadataMap.set(issueTrackerProjectId, metadata);

    console.log(`Metadata loaded for project ${issueTrackerProjectId}.`);
    return metadata;
  } catch (error) {
    console.error(
      `Failed to load metadata for project ${issueTrackerProjectId}:`,
      error.message
    );
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
}

// --- Issue Processing ---
async function processJiraIssue(jiraIssue) {
  // 1. Get or Create Project
  const issueTrackerProjectId = await getOrCreateIssueTrackerProject(
    jiraIssue.fields.project
  );

  // 2. Get project-specific metadata
  const { statusMap, typeMap, priorityMap } = await getProjectMetadata(
    issueTrackerProjectId
  );

  // 3. Get or Create Reporter
  const reporterUserId = await getOrCreateIssueTrackerUser(
    jiraIssue.fields.reporter
  );

  // 4. Get or Create Assignee (if exists)
  let assigneeUserId = null;
  if (jiraIssue.fields.assignee) {
    assigneeUserId = await getOrCreateIssueTrackerUser(
      jiraIssue.fields.assignee
    );
  }

  // 5. Convert Description (ADF to Markdown)
  const markdownDescription = String(
    convertAdfToMarkdown(jiraIssue.fields.description) || ""
  ); // Ensure it's a string

  // 6. Map other fields to IssueTracker's IssueFormData using project-specific metadata
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
      jiraIssue.fields.issuetype.name, // Use project-specific mapped ID, fallback to name
    priority:
      priorityMap.get(jiraIssue.fields.priority.name) ||
      jiraIssue.fields.priority.name, // Use project-specific mapped ID, fallback to name
    status: statusMap.get(issueTrackerStatusName), // Use project-specific mapped ID
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

          // 한글 파일명 처리
          let filename = jiraAttachment.filename;

          // 여러 방법으로 파일명 디코딩 시도
          const attempts = [
            { method: "original", value: filename },
            {
              method: "decodeURIComponent",
              value: (() => {
                try {
                  return decodeURIComponent(filename);
                } catch {
                  return null;
                }
              })(),
            },
            {
              method: "latin1->utf8",
              value: Buffer.from(filename, "latin1").toString("utf8"),
            },
            {
              method: "base64->utf8",
              value: (() => {
                try {
                  return Buffer.from(filename, "base64").toString("utf8");
                } catch {
                  return null;
                }
              })(),
            },
          ];

          // 가장 적절한 디코딩 방법 선택 (한글이 제대로 보이는 것)
          for (const attempt of attempts) {
            if (attempt.value && /[가-힣]/.test(attempt.value)) {
              filename = attempt.value;
              break;
            }
          }

          // 한글이 없다면 원본 사용
          if (!/[가-힣]/.test(filename)) {
            filename = jiraAttachment.filename;
          }

          // FormData에 파일 추가 - 한글 파일명을 위한 특별한 처리
          const buffer = Buffer.from(attachmentResponse.data);

          // ASCII가 아닌 문자가 있으면 URL 인코딩
          let safeFilename = filename;
          if (!/^[\x00-\x7F]*$/.test(filename)) {
            // 한글이 포함된 경우, percent-encoding 사용
            safeFilename = encodeURIComponent(filename);
          }

          attachmentFormData.append("files", buffer, {
            filename: safeFilename,
            contentType: jiraAttachment.mimeType || "application/octet-stream",
            knownLength: buffer.length,
          });

          // 원본 파일명도 별도 필드로 전송
          attachmentFormData.append("originalFilename", filename);

          attachmentFormData.append("isMigration", "true"); // 마이그레이션 모드 플래그

          // Upload to IssueTracker
          const headers = attachmentFormData.getHeaders();

          await issueTrackerApi.put(
            `/issues/${issueTrackerIssueId}`,
            attachmentFormData,
            {
              headers: {
                ...headers,
                // FormData 라이브러리가 생성한 Content-Type 유지 (boundary 포함)
              },
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
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

// --- Command Line Argument Parsing ---
function parseArguments() {
  const args = process.argv.slice(2);
  const result = {
    mode: "migrate",
    startNumber: null,
    endNumber: null,
  };

  // Check for verify mode
  if (args.includes("--verify") || args.includes("-v")) {
    result.mode = "verify";
    // Remove verify flag from args for further processing
    const verifyIndex = args.findIndex(
      (arg) => arg === "--verify" || arg === "-v"
    );
    args.splice(verifyIndex, 1);
  }

  // Parse issue range
  if (args.length === 0) {
    return result;
  }

  if (args.length === 1) {
    const startNumber = parseInt(args[0]);
    if (isNaN(startNumber)) {
      console.error("Invalid start issue number:", args[0]);
      process.exit(1);
    }
    result.startNumber = startNumber;
    return result;
  }

  if (args.length === 2) {
    const startNumber = parseInt(args[0]);
    const endNumber = parseInt(args[1]);
    if (isNaN(startNumber) || isNaN(endNumber)) {
      console.error("Invalid issue number range:", args[0], args[1]);
      process.exit(1);
    }
    if (startNumber > endNumber) {
      console.error("Start number must be less than or equal to end number");
      process.exit(1);
    }
    result.startNumber = startNumber;
    result.endNumber = endNumber;
    return result;
  }

  console.error(
    "Too many arguments. Usage: node migrateJira.mjs [--verify] [startNumber] [endNumber]"
  );
  process.exit(1);
}

function shouldProcessIssue(issueKey, startNumber, endNumber) {
  if (!startNumber && !endNumber) {
    return true; // Process all issues
  }

  // Extract number from issue key (e.g., "GA-200" -> 200)
  const match = issueKey.match(/-(\d+)$/);
  if (!match) {
    console.warn(`Could not extract issue number from key: ${issueKey}`);
    return false;
  }

  const issueNumber = parseInt(match[1]);

  if (startNumber && issueNumber < startNumber) {
    return false;
  }

  if (endNumber && issueNumber > endNumber) {
    return false;
  }

  return true;
}

// --- Verification Functions ---
async function verifyMigration(startNumber, endNumber) {
  console.log("Starting migration verification...");

  const loggedIn = await loginToIssueTracker();
  if (!loggedIn) {
    console.error("Aborting verification due to failed IssueTracker login.");
    return;
  }

  const results = {
    jiraIssues: new Map(), // issueNumber -> jiraIssue
    trackerIssues: new Map(), // issueNumber -> trackerIssue
    missingInTracker: [], // Issues in Jira but not in Tracker
    missingInJira: [], // Issues in Tracker but not in Jira
    numberMismatches: [], // Issues where GA-X number doesn't match
    totalJiraIssues: 0,
    totalTrackerIssues: 0,
  };

  try {
    // 1. Fetch all Jira issues
    console.log("Fetching Jira issues...");
    let startAt = 0;
    const maxResults = 100;

    while (true) {
      const searchResponse = await jiraApi.post("/rest/api/3/search", {
        jql: "ORDER BY created ASC",
        startAt: startAt,
        maxResults: maxResults,
        fields: ["summary", "created", "project"],
      });

      const issues = searchResponse.data.issues;
      if (issues.length === 0) break;

      for (const jiraIssue of issues) {
        const match = jiraIssue.key.match(/-(\d+)$/);
        if (match) {
          const issueNumber = parseInt(match[1]);
          if (shouldProcessIssue(jiraIssue.key, startNumber, endNumber)) {
            results.jiraIssues.set(issueNumber, {
              key: jiraIssue.key,
              summary: jiraIssue.fields.summary,
              created: jiraIssue.fields.created,
              projectKey: jiraIssue.fields.project.key,
            });
            results.totalJiraIssues++;
          }
        }
      }

      startAt += issues.length;
      if (startAt >= searchResponse.data.total) break;
    }

    // 2. Fetch all IssueTracker issues
    console.log("Fetching IssueTracker issues...");

    // Get all projects first to create a project map
    const projectsResponse = await issueTrackerApi.get("/projects");
    const projects = projectsResponse.data;
    const projectMap = new Map();
    projects.forEach((project) => {
      projectMap.set(project.id, project);
    });

    // Get all issues using the existing API
    const issuesResponse = await issueTrackerApi.get("/issues");
    const issues = issuesResponse.data;

    for (const trackerIssue of issues) {
      const match = trackerIssue.issueKey.match(/-(\d+)$/);
      if (match) {
        const issueNumber = parseInt(match[1]);
        if (shouldProcessIssue(trackerIssue.issueKey, startNumber, endNumber)) {
          const project = projectMap.get(trackerIssue.projectId);
          results.trackerIssues.set(issueNumber, {
            key: trackerIssue.issueKey,
            title: trackerIssue.title,
            createdAt: trackerIssue.createdAt,
            projectKey: project ? project.key : "UNKNOWN",
          });
          results.totalTrackerIssues++;
        }
      }
    }

    // 3. Compare and find discrepancies
    console.log("Comparing issues...");

    // Find missing issues in tracker
    for (const [issueNumber, jiraIssue] of results.jiraIssues) {
      if (!results.trackerIssues.has(issueNumber)) {
        results.missingInTracker.push({
          number: issueNumber,
          jiraKey: jiraIssue.key,
          summary: jiraIssue.summary,
        });
      }
    }

    // Find missing issues in Jira (shouldn't happen but good to check)
    for (const [issueNumber, trackerIssue] of results.trackerIssues) {
      if (!results.jiraIssues.has(issueNumber)) {
        results.missingInJira.push({
          number: issueNumber,
          trackerKey: trackerIssue.key,
          title: trackerIssue.title,
        });
      }
    }

    // Find number mismatches
    for (const [issueNumber, jiraIssue] of results.jiraIssues) {
      const trackerIssue = results.trackerIssues.get(issueNumber);
      if (trackerIssue && jiraIssue.key !== trackerIssue.key) {
        results.numberMismatches.push({
          number: issueNumber,
          jiraKey: jiraIssue.key,
          trackerKey: trackerIssue.key,
        });
      }
    }

    // 4. Report results
    console.log("\n=== MIGRATION VERIFICATION RESULTS ===");
    console.log(`Jira Issues: ${results.totalJiraIssues}`);
    console.log(`IssueTracker Issues: ${results.totalTrackerIssues}`);
    console.log(`Missing in IssueTracker: ${results.missingInTracker.length}`);
    console.log(`Missing in Jira: ${results.missingInJira.length}`);
    console.log(`Number Mismatches: ${results.numberMismatches.length}`);

    if (results.missingInTracker.length > 0) {
      console.log("\n📋 MISSING IN ISSUETRACKER:");
      results.missingInTracker.sort((a, b) => a.number - b.number);
      for (const missing of results.missingInTracker) {
        console.log(`  ${missing.jiraKey}: ${missing.summary}`);
      }
    }

    if (results.missingInJira.length > 0) {
      console.log("\n🔍 MISSING IN JIRA (unexpected):");
      results.missingInJira.sort((a, b) => a.number - b.number);
      for (const missing of results.missingInJira) {
        console.log(`  ${missing.trackerKey}: ${missing.title}`);
      }
    }

    if (results.numberMismatches.length > 0) {
      console.log("\n⚠️  NUMBER MISMATCHES:");
      results.numberMismatches.sort((a, b) => a.number - b.number);
      for (const mismatch of results.numberMismatches) {
        console.log(
          `  Number ${mismatch.number}: Jira=${mismatch.jiraKey}, Tracker=${mismatch.trackerKey}`
        );
      }
    }

    if (
      results.missingInTracker.length === 0 &&
      results.numberMismatches.length === 0
    ) {
      console.log(
        "\n✅ Migration verification passed! All issues are properly migrated."
      );
    } else {
      console.log(
        "\n❌ Migration verification found issues that need attention."
      );
    }
  } catch (error) {
    console.error("Verification failed:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

// --- Usage Help ---
function showUsage() {
  console.log(`
Jira to IssueTracker Migration Script

Usage:
  node migrateJira.mjs [--verify] [startNumber] [endNumber]

Modes:
  Default mode         Migrate issues from Jira to IssueTracker
  --verify, -v         Verify migration by comparing Jira and IssueTracker issues

Arguments:
  startNumber   Issue number to start from (e.g., 200 for GA-200)
  endNumber     Issue number to end at (optional)

Examples:
  node migrateJira.mjs                    # Migrate all issues
  node migrateJira.mjs 150                # Migrate GA-150, GA-151, GA-152, etc.
  node migrateJira.mjs 100 200            # Migrate GA-100 through GA-200
  
  node migrateJira.mjs --verify           # Verify all migrated issues
  node migrateJira.mjs --verify 100       # Verify issues from GA-100 onwards
  node migrateJira.mjs --verify 100 200   # Verify issues GA-100 through GA-200
`);
}

// --- Main Function ---
async function main() {
  // Check for help flag
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    showUsage();
    return;
  }

  const { mode, startNumber, endNumber } = parseArguments();

  if (mode === "verify") {
    await verifyMigration(startNumber, endNumber);
    return;
  }

  // Original migration logic
  await migrateJiraIssues(startNumber, endNumber);
}

// --- Main Migration Function ---
async function migrateJiraIssues(startNumber, endNumber) {
  if (startNumber || endNumber) {
    console.log(
      `Starting Jira issue migration (range: ${startNumber || "start"} to ${
        endNumber || "end"
      })...`
    );
  } else {
    console.log("Starting Jira issue migration (all issues)...");
  }

  try {
    const loggedIn = await loginToIssueTracker();
    if (!loggedIn) {
      console.error("Aborting migration due to failed IssueTracker login.");
      return;
    }
    // 1. Migrate Projects
    console.log("Migrating Jira projects...");
    const jiraProjectsResponse = await jiraApi.get("/rest/api/3/project");
    for (const jiraProject of jiraProjectsResponse.data) {
      await getOrCreateIssueTrackerProject(jiraProject);
    }
    console.log(`Migrated ${projectMap.size} projects.`);

    // 2. Migrate Users (This is a simplified approach. A full migration would involve fetching all users from Jira's user API)
    // For now, we'll rely on users being created on demand when issues are migrated.
    console.log("User migration will happen on demand during issue migration.");

    // 3. Migrate Issues (metadata will be loaded per project as needed)
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
        // Check if this issue should be processed based on range filter
        if (!shouldProcessIssue(jiraIssue.key, startNumber, endNumber)) {
          console.log(`Skipping issue ${jiraIssue.key} (outside range)`);
          continue;
        }

        console.log(`Processing issue ${jiraIssue.key}...`);

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

// --- Run the script ---
main();
