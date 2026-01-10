const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const CLERK_TOKEN = process.env.TEST_CLERK_TOKEN; // User would provide this

async function runE2ETests() {
  console.log('🚀 Starting E2E API Health Check...');
  console.log(`📍 Targeting: ${API_BASE_URL}`);

  if (!CLERK_TOKEN) {
    console.error('❌ Error: TEST_CLERK_TOKEN is missing. Provide a valid Clerk JWT to run real tests.');
    process.exit(1);
  }

  const authHeader = { Authorization: `Bearer ${CLERK_TOKEN}` };

  try {
    // 1. Check Backend Health
    console.log('\n--- [1/5] Health Check ---');
    const health = await axios.get(`${API_BASE_URL}/health`).catch(() => ({ status: 404 }));
    if (health.status === 200) {
      console.log('✅ Backend is healthy.');
    } else {
      console.log('⚠️ Backend health check failed (expected if /health is not implemented).');
    }

    // 2. List Projects
    console.log('\n--- [2/5] Project Listing ---');
    const projectsResp = await axios.get(`${API_BASE_URL}/projects`, { headers: authHeader });
    console.log(`✅ Successfully fetched ${projectsResp.data.length} projects.`);

    // 3. Create a Dummy Project (Dry Run if possible, or just check existing)
    console.log('\n--- [3/5] Project Detail Check ---');
    if (projectsResp.data.length > 0) {
      const firstProject = projectsResp.data[0];
      const detailResp = await axios.get(`${API_BASE_URL}/projects/${firstProject.project_id}`, { headers: authHeader });
      console.log(`✅ Successfully fetched details for project: ${detailResp.data.project_name}`);
    } else {
      console.log('⏭️ No projects found to check details.');
    }

    // 4. Roadmap Verification
    console.log('\n--- [4/5] Roadmap Verification ---');
    if (projectsResp.data.length > 0) {
      const projectId = projectsResp.data[0].project_id;
      const roadmapResp = await axios.get(`${API_BASE_URL}/projects/${projectId}/roadmap`, { headers: authHeader });
      console.log(`✅ Successfully fetched roadmap with ${roadmapResp.data.concepts.length} concepts.`);
    }

    // 5. Workspace & File System Check
    console.log('\n--- [5/5] Workspace & File System ---');
    if (projectsResp.data.length > 0) {
      const projectId = projectsResp.data[0].project_id;
      const wsResp = await axios.post(`${API_BASE_URL}/workspaces`, { project_id: projectId }, { headers: authHeader });
      const workspaceId = wsResp.data.workspace_id;
      console.log(`✅ Workspace initialized: ${workspaceId}`);

      // Try listing files
      const filesResp = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/files?path=/workspace`, { headers: authHeader });
      console.log(`✅ Successfully listed ${filesResp.data.length} files in workspace root.`);
    }

    console.log('\n✨ E2E API Health Check Complete!');
  } catch (error) {
    console.error('\n❌ E2E Test Failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   Message: ${error.message}`);
    }
  }
}

runE2ETests();

