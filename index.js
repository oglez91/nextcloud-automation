require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const { NEXTCLOUD_URL, NEXTCLOUD_ADMIN, NEXTCLOUD_PASSWORD } = process.env;
const auth = { username: NEXTCLOUD_ADMIN, password: NEXTCLOUD_PASSWORD };

function mkcol(path) {
  const url = `${NEXTCLOUD_URL}/remote.php/dav/files/${NEXTCLOUD_ADMIN}/${path}`;
  return axios.request({ method: 'MKCOL', url, auth });
}

async function createFolders(agencyName) {
  const folders = [
    `${agencyName}/Clients`,
    `${agencyName}/Therapist`,
    `${agencyName}/Office/Billing`,
    `${agencyName}/Office/Admission`,
    `${agencyName}/Office/Payroll`,
  ];

  for (const f of folders) {
    await mkcol(f);
    console.log(`📁 Creada carpeta: ${f}`);
  }
}

async function createUser(username, password, email, group) {
  const baseUrl = `${NEXTCLOUD_URL}/ocs/v1.php/cloud/users`;

  await axios.post(
    baseUrl,
    new URLSearchParams({ userid: username, password }),
    { auth, headers: { 'OCS-APIRequest': 'true' } }
  );

  await axios.post(
    `${baseUrl}/${username}/groups`,
    new URLSearchParams({ groupid: group }),
    { auth, headers: { 'OCS-APIRequest': 'true' } }
  );

  await axios.put(
    `${baseUrl}/${username}`,
    new URLSearchParams({ key: 'email', value: email }),
    { auth, headers: { 'OCS-APIRequest': 'true' } }
  );
}

app.post('/api/create-agency', async (req, res) => {
  try {
    const { agency_name, admin_email, admin_password } = req.body;

    const username = `admin_${agency_name.toLowerCase().replace(/\s+/g, '')}`;

    await createFolders(agency_name);
    await createUser(username, admin_password, admin_email, 'agency_admin');

    res.status(200).json({ success: true, message: 'Agencia y usuario creados en Nextcloud' });
  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log('🚀 Servidor escuchando en puerto 3000');
});
