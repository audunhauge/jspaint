// @ts-check

function startNewPage() {
  const np = g("newpage");
  np.classList.remove("hidden");
  const template = /** @type {HTMLTemplateElement} */ (g("form"));
  const clone = template.content.cloneNode(true);
  np.innerHTML = "";
  np.append(clone);

  const btnCancel = g("cancel");
  btnCancel.addEventListener("click", (e) => {
    np.classList.add("hidden");
  });

  const btnOK = g("ok");
  btnOK.addEventListener("click", (e) => {
    np.classList.add("hidden");
    cleanGhost();
    cleanCanvas();
    AT.color = "blue";
    AT.fill = "transparent";
    drawings = [];
    SelectedShapes.list = []; // no selected shapes
    // code to read values form form
    const pageSize = np.querySelector("#pagesize").value ?? "A4";
    const orientation = np.querySelector("input[name=orientation]:checked").value ?? "landscape";
    const width = +np.querySelector("#width").value || 1024;
    const height = +np.querySelector("#height").value || 800;
    const background = np.querySelector("input[name=bg]:checked").value ?? "#ffffff";
    document.documentElement.style.setProperty("--backgrd", background);
    document.documentElement.style.setProperty("--width", String(width) + "px");
    document.documentElement.style.setProperty("--height", String(height) + "px");
    // the size of canvas must be changed in html
    const canvas = g("canvas");
    const ghost = g("ghost");
    canvas.width = width;
    canvas.height = height;
    ghost.width = width;
    ghost.height = height;
  });
}
