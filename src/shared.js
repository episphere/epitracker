export const sort = (items = []) => {
  return items.sort((a, b) => {
    const nameA = a.text.toUpperCase();
    const nameB = b.text.toUpperCase();

    if (nameA === 'ALL' || nameB === 'ALL') {
      return 1
    }
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }

    // names must be equal
    return 0;
  });
}

export const getFolderItems = async (id) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let r = await fetch("https://api.box.com/2.0/folders/" + id + "/items", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + access_token,
      },
    });
    if (r.status === 401) {
      if ((await refreshToken()) === true) return await getFolderItems(id);
    } else if (r.status === 200) {
      return r.json();
    } else {
      hideAnimation();
      console.error(r);
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await getFolderItems(id);
  }
};

export const getFileRange = async (id, start, end) => {
  const access_token = JSON.parse(localStorage.parms).access_token;
  const response = await fetch(`https://api.box.com/2.0/files/${id}/content`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      range: `bytes=${start}-${end}`,
    },
  });
  return response.text();
};

export const getFolderInfo = async (id) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let r = await fetch("https://api.box.com/2.0/folders/" + id, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + access_token,
      },
    });
    if (r.status === 401) {
      if ((await refreshToken()) === true) return await getFolderInfo(id);
    } else if (r.status === 200) {
      return r.json();
    } else {
      hideAnimation();
      console.error(r);
      return false;
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await getFolderInfo(id);
  }
};

export const getPublicFile = async (sharedName, id) => {
  let r = await fetch(
    `https://us-central1-nih-nci-dceg-episphere-dev.cloudfunctions.net/epitrackerPublicData?fileId=${id}&sharedName=${sharedName}`,
    {
      method: "GET",
    }
  );
  if (r.status === 200) {
    return r.json();
  } else {
    hideAnimation();
    console.error(r);
  }
};

export const getFile = async (id) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let r = await fetch(`https://api.box.com/2.0/files/${id}/content`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + access_token,
      },
    });
    if (r.status === 401) {
      if ((await refreshToken()) === true) return await getFile(id);
    } else if (r.status === 200) {
      return r.text();
    } else if (r.status === 404) {
      return "{'status':'File does not exist'}";
    } else {
      hideAnimation();
      console.error(r);
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await getFile(id);
  }
};

export const getFileInfo = async (id) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let r = await fetch("https://api.box.com/2.0/files/" + id, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + access_token,
      },
    });
    if (r.status === 401) {
      if ((await refreshToken()) === true) return await getFileInfo(id);
    } else if (r.status === 200) {
      return r.json();
    } else {
      hideAnimation();
      console.error(r);
      return false;
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await getFileInfo(id);
  }
};

export const getFileVersions = async (id) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let r = await fetch(`https://api.box.com/2.0/files/${id}/versions`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + access_token,
      },
    });
    if (r.status === 401) {
      if ((await refreshToken()) === true) return await getFileVersions(id);
    } else if (r.status === 200) {
      return r.json();
    } else {
      hideAnimation();
      console.error(r);
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await getFileVersions(id);
  }
};


export const createFolder = async (folderId, folderName) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let obj = {
      name: folderName,
      parent: {
        id: folderId,
      },
    };
    let response = await fetch("https://api.box.com/2.0/folders", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + access_token,
      },
      body: JSON.stringify(obj),
      redirect: "follow",
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await createFolder(folderId, folderName);
    } else if (response.status === 201) {
      return response.json();
    } else {
      return {
        status: response.status,
        statusText: response.statusText,
      };
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await createFolder(folderId, folderName);
  }
};

export const descFolder = async (folderId, description) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;

    let response = await fetch(`https://api.box.com/2.0/folders/${folderId}`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + access_token,
      },
      body: JSON.stringify({
        description: description,
      }),//JSON.stringify(obj),
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await descFolder(folderId, description);
    } else if (response.status === 201) {
      return response;
    } else {
      return {
        status: response.status,
        statusText: response.statusText,
      };
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await descFolder(folderId, description);
  }
};

export const descFile = async (fileId, description) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let response = await fetch(`https://api.box.com/2.0/files/${fileId}`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + access_token,
      },
      body: JSON.stringify({
        description: description,
      }),//JSON.stringify(obj),
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await descFile(fileId, description);
    } else if (response.status === 201) {
      return response;
    } else {
      return {
        status: response.status,
        statusText: response.statusText,
      };
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await descFile(fileId, description);
  }
};

export const copyFile = async (fileId, parentId) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let obj = {
      parent: {
        id: parentId,
      },
    };
    let response = await fetch(`https://api.box.com/2.0/files/${fileId}/copy`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + access_token,
      },
      body: JSON.stringify(obj),
      redirect: "follow",
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await copyFile(fileId, parentId);
    } else if (response.status === 201) {
      return response.json();
    } else {
      return {
        status: response.status,
        statusText: response.statusText,
      };
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await copyFile(fileId, parentId);
  }
};

export const moveFile = async (fileId, parentId) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    let obj = {
      parent: {
        id: parentId,
      },
    };
    let response = await fetch(`https://api.box.com/2.0/files/${fileId}`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + access_token,
      },
      body: JSON.stringify(obj),
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await moveFile(fileId, parentId);
    } else if (response.status === 201) {
      return response;
    } else {
      return {
        status: response.status,
        statusText: response.statusText,
      };
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await moveFile(fileId, parentId);
  }
};

export const uploadFile = async (data, fileName, folderId, html) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const form = new FormData();
    let blobData = "";
    if (html){
      console.log('Using HTML');
      blobData = new Blob([data], {
        type: "text/html",
      });
    } else{
      blobData = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
    }
    form.append("file", blobData);
    form.append(
      "attributes",
      `{"name": "${fileName}", "parent": {"id": "${folderId}"}}`
    );

    let response = await fetch("https://upload.box.com/api/2.0/files/content", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + access_token,
      },
      body: form,
      contentType: false,
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await uploadFile(data, fileName, folderId, html);
    } else if (response.status === 201) {
      return response.json();
    } else if (response.status === 409) {
      return {
        status: response.status,
        json: await response.json(),
      };
    } else {
      return {
        status: response.status,
        statusText: response.statusText,
      };
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await uploadFile(data, fileName, folderId, html);
  }
};

export const uploadTSV = async (data, fileName, folderId, html) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const form = new FormData();
    let blobData = "";
    console.log('Using HTML');
    blobData = new Blob([data], {
      type: "text/html",
    });
    form.append("file", blobData);
    form.append(
      "attributes",
      `{"name": "${fileName}", "parent": {"id": "${folderId}"}}`
    );

    let response = await fetch("https://upload.box.com/api/2.0/files/content", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + access_token,
      },
      body: form,
      contentType: false,
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await uploadFile(data, fileName, folderId, html);
    } else if (response.status === 201) {
      return response.json();
    } else if (response.status === 409) {
      return {
        status: response.status,
        json: await response.json(),
      };
    } else {
      return {
        status: response.status,
        statusText: response.statusText,
      };
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await uploadFile(data, fileName, folderId, html);
  }
};

export const uploadFileAny = async (data, fileName, folderId) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const form = new FormData();
    form.append("file", data);
    form.append(
      "attributes",
      `{"name": "${fileName}", "parent": {"id": "${folderId}"}}`
    );

    let response = await fetch("https://upload.box.com/api/2.0/files/content", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + access_token,
      },
      body: form,
      contentType: false,
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await uploadFileAny(data, fileName, folderId);
    } else if (response.status === 201) {
      return response.json();
    } else if (response.status === 409) {
      return {
        status: response.status,
        json: await response.json(),
      };
    } else {
      return {
        status: response.status,
        statusText: response.statusText,
      };
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await uploadFileAny(data, fileName, folderId);
  }
};

export const uploadWordFile = async (data, fileName, folderId, html) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    //const user = await getCurrentUser();
    //Check for bad data
    const form = new FormData();
    form.append("file", data);
    form.append(
      "attributes",
      `{
            "name": "${fileName}", "parent": {"id": "${folderId}"}}`
    );

    let response = await fetch("https://upload.box.com/api/2.0/files/content", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + access_token,
      },
      body: form,
      contentType: false,
    });
    if (response.status === 400) {
      if (response.code === "bad_request") {
        return "Bad request";
      }
      if ((await refreshToken()) === true)
        return await uploadWordFile(data, fileName, folderId, html);
    } else if (response.status === 201) {
      return response.json();
    } else if (response.status === 400) {
      return {
        status: response.status,
        json: await response.json(),
      };
    } else {
      return {
        status: response.status,
        statusText: response.statusText,
      };
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await uploadWordFile(data, fileName, folderId, html);
  }
};
export const uploadFileVersion = async (data, fileId, type) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const form = new FormData();
    let blobData = "";
    if (type === "text/html" || type === "text/csv")
      blobData = new Blob([data], {
        type: type,
      });
    else
      blobData = new Blob([JSON.stringify(data)], {
        type: type,
      });

    form.append("file", blobData);

    let response = await fetch(
      `https://upload.box.com/api/2.0/files/${fileId}/content`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + access_token,
        },
        body: form,
        contentType: false,
      }
    );
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await uploadFileVersion(data, fileId, type);
    } else if (response.status === 201) {
      return response.json();
    } else {
      return {
        status: response.status,
        statusText: response.statusText,
      };
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await uploadFileVersion(data, fileId, "text/html");
  }
};

export const uploadWordFileVersion = async (data, fileId) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;

    form.append("file", data);

    let response = await fetch(
      `https://upload.box.com/api/2.0/files/${fileId}/content`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + access_token,
        },
        body: form,
        contentType: false,
      }
    );
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await uploadFileVersion(data, fileId, type);
    } else if (response.status === 201) {
      return response.json();
    } else {
      return {
        status: response.status,
        statusText: response.statusText,
      };
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await uploadFileVersion(data, fileId, "text/html");
  }
};

export const updateDuplicateFileName = async (fileId) => {
  let file = await getFileInfo(fileId);
  const fileFolder = file.parent.id;
  const filename = file.name;
  const folderItems = await getFolderItems(fileFolder);
  const folderFilenames = folderItems.map((item) => item.name);
  const [name, extension] = filename.split(".");
  let i = 1;
  while (folderFilenames.includes(filename)) {
    if (filename.includes(")")) {
      const [name, version] = filename.split("(");
      filename = name + `(${i})` + version.substring(2);
    } else {
      filename = name + `(${i}).` + extension;
    }
    i++;
  }

  return filename;
};

export const getCollaboration = async (id, type) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(
      `https://api.box.com/2.0/${type}/${id}/collaborations`,
      {
        headers: {
          Authorization: "Bearer " + access_token,
        },
      }
    );
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await getCollaboration(id, type);
    }
    if (response.status === 200) {
      return response.json();
    } else {
      return null;
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await getCollaboration(id, type);
  }
};

export const getFileAccessStats = async (id) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(
      `https://api.box.com/2.0/file_access_stats/${id}`,
      {
        headers: {
          Authorization: "Bearer " + access_token,
        },
      }
    );
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await getFileAccessStats(id, type);
    }
    if (response.status === 200) {
      return response.json();
    } else {
      return null;
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await getFileAccessStats(id, type);
  }
};

export const getCurrentUser = async () => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/users/me`, {
      headers: {
        Authorization: "Bearer " + access_token,
      },
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true) return await getCurrentUser();
    }
    if (response.status === 200) {
      return response.json();
    } else {
      return null;
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await getCurrentUser();
  }
};

export const getUser = async (id) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/users/${id}`, {
      headers: {
        Authorization: "Bearer " + access_token,
      },
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true) return await getUser(id);
    }
    if (response.status === 200) {
      return response.json();
    } else {
      return null;
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await getUser(id);
  }
};

export const addNewCollaborator = async (id, type, login, role) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const obj = {
      item: {
        type: type,
        id: id,
      },
      accessible_by: {
        type: "user",
        login: login,
      },
      role: role,
    };
    const response = await fetch(`https://api.box.com/2.0/collaborations`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + access_token,
      },
      body: JSON.stringify(obj),
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await addNewCollaborator(id, type, login, role);
    } else {
      return response;
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await addNewCollaborator(id, type, login, role);
  }
};

export const removeBoxCollaborator = async (id) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(
      `https://api.box.com/2.0/collaborations/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + access_token,
        },
      }
    );
    if (response.status === 401) {
      if ((await refreshToken()) === true) return removeBoxCollaborator(id);
    } else {
      return response;
    }
  } catch (err) {
    if ((await refreshToken()) === true) return removeBoxCollaborator(id);
  }
};

export const updateBoxCollaborator = async (id, role) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(
      `https://api.box.com/2.0/collaborations/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + access_token,
        },
        body: JSON.stringify({
          role: role,
        }),
      }
    );
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await updateBoxCollaborator(id, role);
    } else {
      return response;
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await updateBoxCollaborator(id, role);
  }
};

export const updateBoxCollaboratorTime = async (id, role, time) => {
  try {
      const access_token = JSON.parse(localStorage.parms).access_token;
      const response = await fetch(`https://api.box.com/2.0/collaborations/${id}`, {
          method: 'PUT',
          headers: {
              Authorization: "Bearer "+access_token
          },
          body: JSON.stringify(
              {role: role,
              expires_at: time})
      });
      if(response.status === 401){
          if((await refreshToken()) === true) return await updateBoxCollaboratorTime(id, role, time);
      }
      else {
          return response;
      }
  }
  catch(err) {
      if((await refreshToken()) === true) return await updateBoxCollaboratorTime(id, role, time);
  }
};

export const deleteTask = async (taskId) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + access_token,
        "Content-Type": "application/json",
        "Allow-Access-Control-Methods": "DELETE",
      },
    });
    if (response.status === 403) {
      if ((await refreshToken()) === true) return await getTaskList(taskId);
    }
    if (response.status === 404) {
      return;
    }
    if (response.status === 204) {
      return;
    } else {
      return null;
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await deleteTask(taskId);
  }
};
export const getTaskList = async (id) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/files/${id}/tasks`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + access_token,
      },
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true) return await getTaskList(id);
    }
    if (response.status === 200) {
      return response.json();
    } else {
      return null;
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await getTaskList(id);
  }
};

export const getTask = async (id) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/tasks/${id}`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + access_token,
      },
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true) return await getTask(id);
    }
    if (response.status === 200) {
      return response.json();
    } else {
      return null;
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await getTask(id);
  }
};

export const createFileTask = async (fileId) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/tasks`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + access_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        item: {
          id: fileId.toString(),
          type: "file",
        },
        action: "review",
      }),
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true) return await createFileTask(fileId);
    } else {
      return response;
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await createFileTask(fileId);
  }
};

export const createCompleteTask = async (fileId, message) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/tasks`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + access_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        item: {
          id: fileId.toString(),
          type: "file",
        },
        action: "complete",
        message: message,
      }),
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await createCompleteTask(fileId, message);
    } else {
      return response;
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await createCompleteTask(fileId, message);
  }
};

export const assignTask = async (taskId, userId) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/task_assignments`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + access_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task: {
          id: taskId.toString(),
          type: "task",
        },
        assign_to: {
          login: userId,
        },
      }),
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await assignTask(taskId, userId);
    } else {
      return response;
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await assignTask(taskId, userId);
  }
};

export const updateTaskAssignment = async (id, res_state, msg = "") => {
  try {
    let body = msg.length
      ? JSON.stringify({
          resolution_state: res_state,
          message: msg,
        })
      : JSON.stringify({
          resolution_state: res_state,
        });
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(
      `https://api.box.com/2.0/task_assignments/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + access_token,
        },
        body,
      }
    );
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await updateTaskAssignment(id, res_state, msg);
    } else {
      return response;
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await updateTaskAssignment(id, res_state, msg);
  }
};

export const getChairApprovalDate = async (id) => {
  let fileTasks = await getTaskList(id);
  let completion_date = "";

  fileTasks.entries.forEach((task) => {
    if (task.action === "review") {
      let task_assignments = task.task_assignment_collection.entries;
      task_assignments.forEach((task_assignment) => {
        if (task_assignment.completed_at !== undefined) {
          completion_date = new Date(task_assignment.completed_at)
            .toDateString()
            .substring(4);
        }
      });
    }
  });

  if (completion_date !== "") return completion_date;
  else return "Not Completed";
};

export const createComment = async (id, msg = "") => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(`https://api.box.com/2.0/comments`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + access_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: msg,
        item: {
          type: "file",
          id: id,
        },
      }),
    });
    if (response.status === 401) {
      if ((await refreshToken()) === true) return await createComment(id, msg);
    } else {
      return response;
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await createComment(id, msg);
  }
};
export async function showComments(id) {
  const commentSection = document.getElementById("fileComments");
  const response = await listComments(id);

  let comments = JSON.parse(response).entries;
  if (comments.length === 0) {
    const dropdownSection = document.getElementById(`fileComments`);
    dropdownSection.innerHTML = ` <div class='comments'>
        Comments
        <div class='text-left'>
            No comments to show.
        </div>
        </div>`;

    return;
  }
  let template = `
    <div class='comments'>
    Comments
    <div class='container-fluid'>`;
  const user = JSON.parse(localStorage.parms).login;

  if (emailforChair.includes(user)) {
    for (const comment of comments) {
      const comment_date = new Date(comment.created_at);
      const date = comment_date.toLocaleDateString();
      const time = comment_date.toLocaleTimeString();
      template += `
        <div>
            <div class='row'>
                <div class='col-8 p-0'>
                    <p class='text-primary small mb-0 align-left'>${comment.created_by.name}</p>
                </div>
            `;
      if (document.getElementById("finalChairDecision") !== null) {
        if (
          document.getElementById("finalChairDecision").style.display ===
          "block"
        ) {
          template += `
                <div class='col-4'>
                    <input type='checkbox' name='comments' id='${comment.id}' class='mb-0'>
                </div>
                
                `;
        }
      }
      template += `    
            </div>
            <div class='row'>
                    <p class='my-0' id='comment${comment.id}'>${comment.message}</p>
            </div>

            <div class='row'>
                <p class='small mb-0 font-weight-light'>${date} at ${time}</p>
            </div>
            <hr class='my-1'>
        </div>
        `;
    }
  } else {
    for (const comment of comments) {
      const comment_user = comment.created_by;

      if (
        comment_user.login === user ||
        emailforChair.includes(comment_user.login)
      ) {
        const comment_date = new Date(comment.created_at);
        const date = comment_date.toLocaleDateString();
        const time = comment_date.toLocaleTimeString();
        template += `
        <div>
            <div class='row'>
                <div class='col-8 p-0'>
                    <p class='text-primary small mb-0 align-left'>${comment.created_by.name}</p>
                </div>
            `;
        if (document.getElementById("finalChairDecision") !== null) {
          if (
            document.getElementById("finalChairDecision").style.display ===
            "block"
          ) {
            template += `
                <div class='col-4'>
                    <input type='checkbox' name='comments' id='${comment.id}' class='mb-0'>
                </div>
                
                `;
          }
        }
        template += `    
            </div>
            <div class='row'>
                    <p class='my-0' id='comment${comment.id}'>${comment.message}</p>
            </div>

            <div class='row'>
                <p class='small mb-0 font-weight-light'>${date} at ${time}</p>
            </div>
            <hr class='my-1'>
        </div>
        `;
      }
    }
  }
  template += "</div>";
  if (comments.length >= 0 && document.getElementById("finalChairDecision")) {
    if (
      document.getElementById("finalChairDecision").style.display === "block"
    ) {
      template += `
        <input type='button' class='btn-secondary' value='Copy'  id='copyBtn' onclick="
        const comments = Array.from(document.getElementsByName('comments'));
  
     let copiedComments = [];
     for(const comment of comments){
      

         if (comment.checked){
             let commentText = document.getElementById('comment' + comment.id).innerText;
             if(commentText.includes('Rating:')){
                copiedComments.push(commentText.split(':')[2]);
             }
            else {
                copiedComments.push(commentText);
            }
         }
     }
    
     navigator.clipboard.writeText(copiedComments.join('\\n'));
        "/>
        <div class='text-muted small'>Select comments to copy to clipboard. Paste comments in text box below.</div>
        `;
    }
  }
  commentSection.innerHTML = template;

  return;
}

export async function showCommentsDropDown(id) {
  const commentSection = document.getElementById(`file${id}Comments`);
  const response = await listComments(id);
  let comments = JSON.parse(response).entries;
  if (comments.length === 0) {
    const dropdownSection = document.getElementById(`file${id}Comments`);
    dropdownSection.innerHTML = `
              
                    No Comments to show.
        `;

    return;
  }
  let template = ` 
    <div class='container-fluid'>`;
  const user = JSON.parse(localStorage.parms).login;

  if (emailforChair.includes(user)) {
    for (const comment of comments) {
      const comment_date = new Date(comment.created_at);
      const date = comment_date.toLocaleDateString();
      const time = comment_date.toLocaleTimeString();
      template += `
        <div>
            <div class='row'>
                <div class='col-8 p-0'>
                    <p class='text-primary small mb-0 align-left'>${comment.created_by.name}</p>
                </div>
            `;
      template += `    
            </div>
            <div class='row'>
                    <p class='my-0' id='comment${comment.id}'>${comment.message}</p>
            </div>

            <div class='row'>
                <p class='small mb-0 font-weight-light'>${date} at ${time}</p>
            </div>
            <hr class='my-1'>
        </div>
        `;
    }
  } else {
    for (const comment of comments) {
      const comment_user = comment.created_by;

      if (
        comment_user.login === user ||
        emailforChair.includes(comment_user.login)
      ) {
        const comment_date = new Date(comment.created_at);
        const date = comment_date.toLocaleDateString();
        const time = comment_date.toLocaleTimeString();
        template += `
        <div>
            <div class='row'>
                <div class='col-8 p-0'>
                    <p class='text-primary small mb-0 align-left'>${comment.created_by.name}</p>
                </div>
            `;

        template += `    
            </div>
            <div class='row'>
                    <p class='my-0' id='comment${comment.id}'>${comment.message}</p>
            </div>

            <div class='row'>
                <p class='small mb-0 font-weight-light'>${date} at ${time}</p>
            </div>
            <hr class='my-1'>
        </div>
        `;
      }
    }
  }
  // template += '</div>'

  commentSection.innerHTML = template;

  return;
}

export const listComments = async (id) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(
      `https://api.box.com/2.0/files/${id}/comments`,
      {
        method: "GET",

        headers: {
          Authorization: "Bearer " + access_token,

          "Content-Type": "application/json",
        },

        redirect: "follow",
      }
    );

    if (response.status === 401) {
      if ((await refreshToken()) === true) return await listComments(id);
    } else {
      return response.text();
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await listComments(id);
  }
};

export const createMetadata = async (id) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(
      `https://api.box.com/2.0/files/${id}/metadata/global/properties`,
      {
        //enterprise_355526
        method: "POST",
        headers: {
          Authorization: "Bearer " + access_token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BCRPPchair: "1",
          BCRPPdacc: "0",
        }),
      }
    );
    if (response.status === 401) {
      if ((await refreshToken()) === true) return await createMetadata(id);
    } else {
      return response;
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await createMetadata(id);
  }
};

export const updateMetadata = async (id, path, value) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(
      `https://api.box.com/2.0/files/${id}/metadata/global/properties`,
      {
        //enterprise_355526
        method: "PUT",
        headers: {
          Authorization: "Bearer " + access_token,
          "Content-Type": "application/json-patch+json",
        },
        body: JSON.stringify([
          {
            op: "replace",
            path: "/" + path,
            value: value,
          },
        ]),
      }
    );
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await updateMetadata(id, path, value);
    } else {
      return response;
    }
  } catch (err) {
    if ((await refreshToken()) === true)
      return await updateMetadata(id, path, value);
  }
};

export const getMetadata = async (id) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(
      `https://api.box.com/2.0/files/${id}/metadata`,
      {
        //enterprise_355526
        method: "GET",
        headers: {
          Authorization: "Bearer " + access_token,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.status === 401) {
      if ((await refreshToken()) === true) return await getMetadata(id);
    } else {
      return response.json();
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await getMetadata(id);
  }
};

export const searchMetadata = async (res_state) => {
  try {
    const access_token = JSON.parse(localStorage.parms).access_token;
    const response = await fetch(
      `https://api.box.com/2.0/search?query=BCRPP_uploading_complete`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + access_token,
        },
      }
    );
    if (response.status === 401) {
      if ((await refreshToken()) === true)
        return await searchMetadata(res_state);
    } else {
      return response;
    }
  } catch (err) {
    if ((await refreshToken()) === true) return await searchMetadata(res_state);
  }
};
export const removeActiveClass = (className, activeClass) => {
  let fileIconElement = document.getElementsByClassName(className);
  Array.from(fileIconElement).forEach((elm) => {
    elm.classList.remove(activeClass);
  });
};
export const sessionExpired = () => {
  delete localStorage.parms;
  location.reload();
};

export const showAnimation = () => {
  if (document.getElementById("loadingAnimation"))
    document.getElementById("loadingAnimation").style.display = "block";
};

export const hideAnimation = () => {
  if (document.getElementById("loadingAnimation"))
    document.getElementById("loadingAnimation").style.display = "none";
};

export const getparameters = (query) => {
  const array = query.split("&");
  let obj = {};
  array.forEach((value) => {
    obj[value.split("=")[0]] = value.split("=")[1];
  });
  return obj;
};

export const notificationTemplate = (top, header, body) => {
  return `
        <div style="position: absolute; top: ${top}rem; right: 2rem; z-index: 10;">
            <div class="toast fade show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="mr-auto">${header}</strong>
                    <button title="Close" type="button" class="ml-2 mb-1 close hideNotification" data-dismiss="toast" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="toast-body">
                    ${body}
                </div>
            </div>
        </div>
        `;
};

export const consortiumSelection = async () => {
  let template = "";
  let array = await getValidConsortium();

  if (array.length === 0) return "";
  template +=
    '<strong>Select consortium</strong> <span class="required">*</span><select id="CPCSelect" class="form-control" required>';
  for (let obj = 0; obj < array.length; obj++) {
    const bool = checkMyPermissionLevel(
      await getCollaboration(array[obj].id, `${array[obj].type}s`),
      JSON.parse(localStorage.parms).login
    );
    if (bool === true) {
      if (obj === 0)
        template += '<option value=""> -- Select consortium -- </option>';
      template += `<option value="${array[obj].id}">${array[obj].name}</option>`;
    }
  }
  template += "</select>";
  return template;
};

export const getValidConsortium = async () => {
  const response = await getFolderItems(0);
  return filterConsortiums(response.entries);
};

const consortiums = [
  "Pilot - BCRP_NHS2_Study_Info_and_Data",
  "Pilot - BCRP_NHS_Study_Info_and_Data",
  "Pilot - BCRP_CPS3_Study_Info_and_Data",
  "Pilot - BCRP_CPS2_Study_Info_and_Data",
];

export const filterConsortiums = (array) => {
  return array.filter(
    (obj) => obj.type === "folder" && consortiums.includes(obj.name)
  );
};

export const filterStudies = (array) => {
  return array.filter(
    (obj) =>
      obj.type === "folder" &&
      obj.name !== "epitracker - CPSIII" &&
      obj.name !== "epitracker - Dikshit" &&
      obj.name !== "epitracker - Documents for NCI Participating Studies"
  );
};

export const filterDataTypes = (array) => {
  return array.filter(
    (obj) =>
      obj.type === "folder" && obj.name.toLowerCase().trim() !== "samples"
  );
};

export const filterStudiesDataTypes = (array) => {
  return array.filter(
    (obj) =>
      obj.type === "folder" &&
      obj.name !== "epitracker - CPSIII" &&
      obj.name !== "epitracker - Dikshit" &&
      obj.name !== "epitracker - Documents for NCI Participating Studies" &&
      obj.name !== "Samples"
  );
};

export const filterFiles = (array) => {
  return array.filter((obj) => obj.type === "file");
};

export const filterProjects = (array) => {
  return array.filter(
    (obj) =>
      obj.type === "folder" &&
      obj.name.toLowerCase().indexOf("epitracker_") !== -1 &&
      obj.name.toLowerCase().indexOf("_project") !== -1
  );
};

export const checkMyPermissionLevel = async (data, login, id, type) => {
  if (id) {
    let info;
    if (type === "folder") info = await getFolderInfo(id);
    else info = await getFileInfo(id);
    if (info.created_by.login === login) return true;
  }
  const array = data.entries.filter(
    (d) => d.accessible_by && d.accessible_by.login === login
  );
  if (array.length === 0) {
    const newArray = data.entries.filter(
      (d) => d.created_by && d.created_by.login === login
    );
    if (newArray.length > 0) return true;
  } else if (array[0].role === "editor" || array[0].role === "co-owner") {
    return true;
  }
  return false;
};

export const checkDataSubmissionPermissionLevel = (data, login) => {
  if (data.entries.length === 0) return true;
  const array = data.entries.filter(
    (d) => d.accessible_by && d.accessible_by.login === login
  );
  if (array.length === 0) {
    const newArray = data.entries.filter(
      (d) => d.created_by && d.created_by.login === login
    );
    if (newArray.length > 0) return true;
  } else if (
    array[0].role === "editor" ||
    array[0].role === "co-owner" ||
    array[0].role === "uploader"
  ) {
    return true;
  }
  return false;
};

export const amIViewer = (data, login) => {
  if (data.entries.length === 0) return true;
  const array = data.entries.filter(
    (d) => d.accessible_by && d.accessible_by.login === login
  );
  if (array.length === 1 && array[0].role === "viewer") {
    return true;
  }
  return false;
};

export const csvJSON = (csv) => {
  const lines = csv.replace(/"/g, "").split(/[\r\n]+/g);
  const result = [];
  const headers = lines[0].replace(/"/g, "").split(/[,\t]/g);
  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentline = lines[i].split(/[,\t]/g);
    for (let j = 0; j < headers.length; j++) {
      let value = headers[j];
      if (value === "age_LT20") value = "<20";
      if (value === "age_20_29") value = "20 to 29";
      if (value === "age_30_39") value = "30 to 39";
      if (value === "age_40_49") value = "40 to 49";
      if (value === "age_50_59") value = "50 to 59";
      if (value === "age_60_69") value = "60 to 69";
      if (value === "age_70_79") value = "70 to 79";
      if (value === "age_80_89") value = "80 to 89";
      if (value === "age_90_99") value = "90 to 99";
      if (value === "age_GE100") value = ">99";
      if (value === "birth_year_1900_1909") value = "1900-1909";
      if (value === "birth_year_1910_1919") value = "1910-1919";
      if (value === "birth_year_1920_1929") value = "1920-1929";
      if (value === "birth_year_1930_1939") value = "1930-1939";
      if (value === "birth_year_1940_1949") value = "1940-1949";
      if (value === "birth_year_1950_1959") value = "1950-1959";
      if (value === "birth_year_1960_1969") value = "1960-1969";
      if (value === "birth_year_1970_1979") value = "1970-1979";
      if (value === "birth_year_1980_1989") value = "1980-1989";
      if (value === "birth_year_1990_1999") value = "1990-1999";
      obj[value] = currentline[j];
    }
    if (obj.study !== undefined) {
      result.push(obj);
    }
  }
  for (let obj of result) {
    obj.total = parseInt(obj["statusTotal"]);
  }
  return {
    jsonData: result,
    headers,
  };
};

export const tsv2Json = (tsv) => {
  const lines = tsv
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "")
    .replace(/\n/g, "")
    .split(/[\r]+/g);
  const result = [];
  const headers = lines[0].replace(/"/g, "").split(/[\t]/g);
  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentline = lines[i].split(/[\t]/g);
    for (let j = 0; j < headers.length; j++) {
      if (currentline[j]) {
        let value = headers[j];
        obj[value] = currentline[j];
        //console.log(obj[value]);
      }
    }
    if (Object.keys(obj).length > 0) result.push(obj);
  }
  return {
    data: result,
    headers,
  };
};

export const tsv2Json2 = (tsv) => {
  const lines = tsv
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "")
    .split(/\r?\n/);
  const result = [];
  const headers = lines[0].replace(/"/g, "").split(/[\t]/g);
  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentline = lines[i].split(/[\t]/g);
    for (let j = 0; j < headers.length; j++) {
      if (currentline[j]) {
        let value = headers[j];
        obj[value] = currentline[j];
      }
    }
    if (Object.keys(obj).length > 0) result.push(obj);
  }
  return {
    data: result,
    headers,
  };
};

export const csv2Json = (csv) => {
  const lines = csv.replace(/"/g, "").split(/[\r\n]+/g);
  const result = [];
  const headers = lines[0].replace(/"/g, "").split(/[,\t]/g);
  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentline = lines[i].split(/[,\t]/g);
    for (let j = 0; j < headers.length; j++) {
      if (currentline[j]) {
        let value = headers[j];
        obj[value] = currentline[j];
      }
    }
    if (Object.keys(obj).length > 0) result.push(obj);
  }
  return {
    data: result,
    headers,
  };
};

function CSVtoArray(text) {
  var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
  var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
  // Return NULL if input string is not well formed CSV string.
  //if (!re_valid.test(text)) return null;
  var a = [];                     // Initialize array to receive values.
  text.replace(re_value, // "Walk" the string using replace with callback.
      function(m0, m1, m2, m3) {
          // Remove backslash from \' in single quoted values.
          if      (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
          // Remove backslash from \" in double quoted values.
          else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
          else if (m3 !== undefined) a.push(m3);
          return ''; // Return empty string.
      });
  // Handle special case of empty last value.
  if (/,\s*$/.test(text)) a.push('');
  return a;
};

export const csv2JsonTest = (csv) => {
  //const lines = csv.replace(/""/g,"'").replace(/'/g, "").split(/[\r\n]+/g);
  const lines = csv.replace(/""/g,"'").split(/[\r\n]+/g);
  //console.log(csv);
  const result = [];
  const headers = lines[0].replace(/"/g, "").split(/[,\t]/g);
  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    //const currentline = CSVtoArray(lines[i]);
    //console.log(lines[i]);
    const currentline = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)//match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    //console.log(currentline);
    if (currentline){
      for (let j = 0; j < headers.length; j++) {
        if (currentline[j]) {
          let value = headers[j];
          obj[value] = currentline[j];
        }
      }
    }
    if (Object.keys(obj).length > 0) result.push(obj);
  }
  // console.log(result)
  // console.log(headers)
  return {
    data: result,
    headers,
  };
};

export const json2csv = (json, fields) => {
  if (!fields.includes("study")) fields.push("study");
  const replacer = (key, value) => {
    return value === null ? "" : value;
  };
  let csv = json.map((row) => {
    return fields
      .map((fieldName) => {
        return JSON.stringify(row[fieldName], replacer);
      })
      .join(","); // \t for tsv
  });
  csv.unshift(fields.join(",")); // add header column  \t for tsv
  csv = csv.join("\r\n");
  return csv;
};

export const json2other = (json, fields, tsv) => {
  const replacer = (key, value) => {
    return value === null ? "" : value;
  };
  let csv = json.map((row) => {
    return fields
      .map((fieldName) => {
        return JSON.stringify(row[fieldName], replacer);
      })
      .join(`${tsv ? "\t" : ","}`); // \t for tsv
  });
  csv.unshift(fields.join(`${tsv ? "\t" : ","}`)); // add header column  \t for tsv
  csv = csv.join("\r\n");
  return csv;
};

export const numberWithCommas = (x) => {
  return x
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    .trim();
};

export const mapReduce = (data, variable) => {
  const filteredData = data
    .map((dt) => parseInt(dt[variable]))
    .filter((dt) => isNaN(dt) === false);
  if (filteredData.length > 0) return filteredData.reduce((a, b) => a + b);
  else return 0;
};

export const assignNavbarActive = (element, parent) => {
  removeActiveClass("nav-menu-links", "navbar-active", "grid-elements", "navbar-active");
  // removeActiveClass("grid-elements", "navbar-active");
  element.classList.add("navbar-active");
  if (parent && parent === 1)
    element.parentElement.previousElementSibling.classList.add("navbar-active");
  if (parent && parent === 2)
    element.parentElement.parentElement.previousElementSibling.classList.add(
      "navbar-active"
    );
};

export const reSizePlots = () => {
  document
    .querySelectorAll(".js-plotly-plot")
    .forEach((e) => Plotly.Plots.resize(e));
};

export const shortenText = (str, size) => {
  return str.length > size ? `${str.substr(0, size)}...` : str;
};

export const defaultPageSize = 40;

export const handleRangeRequests = async () => {
  const fileInfo = await getFileInfo("751586322923");
  const fileSize = fileInfo.size;
  const rangeStart = 0;
  const rangeEnd = 10000000;
  console.time("Downloading 10 MB of data");
  const rangeData = await getFileRange("751586322923", rangeStart, rangeEnd);
  console.timeEnd("Downloading 10 MB of data");
  console.time("Parsing");
  const lines = rangeData.trim().split(/[\n]/g);
  const header = lines[0];
  const headerArray = header.split(/[\s]/g);
  const dataArray = [];
  lines.forEach((l, i) => {
    if (rangeStart === 0 && i === 0) return;
    if (i === lines.length - 1) return;
    dataArray.push(l.split(/[\s]/g));
  });
};

export function selectProps(...props){
  return function(obj){
    const newObj = {};
    props.forEach(name =>{
      newObj[name] = obj[name];
    });
    
    return newObj;
  }
};

// Need to change to BCRPP urls
export const applicationURLs = {
  dev: "https://episphere.github.io/dataplatform",
  stage: "https://epitracker-stage.cancer.gov",
  prod: "34.98.117.145",
};
