function getProjectId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function renderList(id, items) {
  const el = document.getElementById(id);
  el.innerHTML = items.map(item => `<li>${item}</li>`).join("");
}

function renderStack(items) {
  const el = document.getElementById("project-stack");
  el.innerHTML = items.map(item => `<span>${item}</span>`).join("");
}

function renderProject(project) {
  document.title = project.title;

  document.getElementById("project-title").textContent = project.title;
  document.getElementById("project-name").textContent = project.title;
  document.getElementById("project-label").textContent = project.label;
  document.getElementById("project-description").textContent = project.description;

  document.getElementById("project-media").innerHTML =
    `<img src="${project.image}" alt="${project.title}" />`;

  renderStack(project.stack);
  renderList("project-features", project.features);
  renderList("project-overview", project.overview);
}

const id = getProjectId();

if (projects[id]) {
  renderProject(projects[id]);
} else {
  document.body.innerHTML = "<h1 style='padding:2rem'>Project not found</h1>";
}