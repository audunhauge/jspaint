// @ts-check

function makeForm(id, actions) {
  const np = g("newpage");
  np.classList.remove("hidden");
  const template = /** @type {HTMLTemplateElement} */ (g(id));
  const clone = template.content.cloneNode(true);
  np.innerHTML = "";
  np.append(clone);
  const selPageSize = g("pagesize");
  const divOrientation = np.querySelector('#orientation');
  const inpWidth = np.querySelector("#width");
  const inpHeight = np.querySelector("#height");

  selPageSize.addEventListener("change", e => {
    const [w,h] = selPageSize.value.split(":");
    inpWidth.value = w;
    inpHeight.value = h;
  });

  divOrientation.addEventListener("click", e => {
    const orientation = np.querySelector("input[name=orientation]:checked").value;
    const [large,small] = [inpWidth.value,inpHeight.value].sort((x,y) => y-x);
    if (orientation === "portrait") {
        inpWidth.value = small;
        inpHeight.value = large;
    } else {
        inpWidth.value = large;
        inpHeight.value = small;
    }
  });

  const btnOK = g("ok");
  btnOK.addEventListener("click", (e) => {
    np.classList.add("hidden");
    actions(np);
  });

  const btnCancel = g("cancel");
  btnCancel.addEventListener("click", (e) => {
    np.classList.add("hidden");
  });
}

function startNewPage() { 
  makeForm("form", (np) => {
    cleanGhost();
    cleanCanvas();
    AT.color = "blue";
    AT.fill = "transparent";
    drawings = [];
    SelectedShapes.list = []; // no selected shapes
    // code to read values form form
    const pageSize = selPageSize.value ?? "A4";
    const orientation = np.querySelector("input[name=orientation]:checked").value ?? "landscape";
    const width = inpWidth.value || 1122;
    const height = inpHeight.value || 794;    
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
    canWidth = width;
    canHeight = height;
    B = g("canvas").getBoundingClientRect(); // x,y for top left corner of canvas
  });
}

function saveToFile() { 
  makeForm("save-file", np => {
    console.log("file saved");
  })
  
}