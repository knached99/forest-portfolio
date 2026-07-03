function getProjectId() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  } catch (e) {
    console.warn("Could not retrieve project ID:", e);
    return null;
  }
}

function renderList(id, items) {
  const el = document.getElementById(id);
  if (!el) return; // Safety check for missing element
  
  if (Array.isArray(items) && items.length > 0) {
    el.innerHTML = items.map(item => `<li>${item}</li>`).join("");
  } else {
    el.innerHTML = "";
  }
}

function renderStack(items) {
  const el = document.getElementById("project-stack");
  if (!el) return; // Safety check for missing element
  
  if (Array.isArray(items) && items.length > 0) {
    el.innerHTML = items.map(item => `<span>${item}</span>`).join("");
  } else {
    el.innerHTML = "";
  }
}

function renderProject(project) {
  if (!project) return; // Safety null check
  
  document.title = project.title || "Project Details";

  // Safe DOM text assignment helper
  const safeSetText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || "";
  };

  safeSetText("project-title", project.title);
  safeSetText("project-name", project.title);
  safeSetText("project-label", project.label);
  safeSetText("project-description", project.description);

  const mediaEl = document.getElementById("project-media");
  if (mediaEl && project.image) {
    mediaEl.innerHTML = `<img src="${project.image}" alt="${project.title || 'Project image'}" />`;
  }

  renderStack(project.stack);
  renderList("project-features", project.features);
  renderList("project-overview", project.overview);

  const actions = document.getElementById("project-actions");
  
  if (actions) {
    if (project.link) {
      actions.innerHTML = `
      <a href="${project.link}"
         target="_blank"
         rel="noopener noreferrer"
         class="project-button">
         Visit Website
      </a>
      `;
    } else {
      actions.innerHTML = "";
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const id = getProjectId();

  // Safety check to ensure projects object is defined globally
  if (typeof projects !== 'undefined' && id && projects[id]) {
    renderProject(projects[id]);
  } else if (document.body) {
    document.body.innerHTML = "<h1 style='padding:2rem'>Project not found</h1>";
  }
});