async function fetchJsonData(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

function getName(name) {
    // remove the word nothing
    name = name.replaceAll("nothing", "");
    name = name.replaceAll("_", " ");
    name = name.replaceAll("p", "P");
    name = name.replaceAll("cmf", "CMF");
    return name;
}

// init
(async () => {
    let url = 'https://raw.githubusercontent.com/quintenvandamme/nothing_archive/refs/heads/main/nothing.json';
    let items = await fetchJsonData(url);

    let body = document.body;
    let nav = document.getElementsByTagName("nav")[0];
    let showDefault = "";

    for (const item of items) {
        for (const key in item) {
            let name = key;
            let buttonName = getName(name);

            if (showDefault === "") {
                showDefault = name;
            }

            // Add nav buttons
            let button = document.createElement("button");
            button.innerHTML = buttonName;
            button.classList.add("font-bold");
            button.onclick = () => toggleAndChangeView(name, true);
            nav.appendChild(button);

            // create main elements
            let main = document.createElement("main");
            main.setAttribute("data-name", name);
            createMain(main, item[key]);
            body.appendChild(main);
        }
    }

    createGithubLogo(nav);

    collapsible();
    toggleMenu();
    view(showDefault);

    // check if the screen width is changed
    window.addEventListener("resize", () => {
        toggleMenu(false, true);
    });
})();

function createGithubLogo(nav) {
    // add the github logo to the nav
    let a = document.createElement("a");
    a.href = "https://github.com/quintenvandamme/nothing_archive";
    a.classList.add("github-logo");
    a.classList.add("dark-only");
    let img = document.createElement("img");
    img.src = "img/github-mark-dark.svg";
    img.alt = "github-mark";
    img.classList.add("github-logo-svg");
    a.appendChild(img);
    nav.appendChild(a);

    let a2 = document.createElement("a");
    a2.href = "https://github.com/quintenvandamme/nothing_archive";
    a2.classList.add("github-logo");
    a2.classList.add("light-only");
    let img2 = document.createElement("img");
    img2.src = "img/github-mark-dark.svg";
    img2.alt = "github-mark";
    img2.classList.add("github-logo-svg");
    a2.appendChild(img2);
    nav.appendChild(a2);
}

function createMain(main, json) {
    for (const key in json) {
        let item = json[key];
        let name = item.name;
        let ota_images = item.ota;
        let boot_images = item.boot;

        let button = document.createElement("button");
        button.type = "button";
        button.classList.add("collapsible");
        button.classList.add("font-ntype82-mono");
        button.innerHTML = name;
        main.appendChild(button);

        let div = document.createElement("div");
        div.classList.add("content");

        let list = document.createElement("div");
        list.classList.add("content-list");
        list.classList.add("flex-col");
        list.classList.add("flex-wrap");

        // build number
        let buildNumber = document.createElement("p");
        buildNumber.classList.add("content-header");
        buildNumber.innerHTML = `Build Number:&nbsp;&nbsp;&nbsp;`;
        let buildNumberValue = document.createElement("p");
        buildNumberValue.classList.add("font-ntype82-mono");
        buildNumberValue.innerHTML = item.build_number + "<br>";
        buildNumber.appendChild(buildNumberValue);
        list.appendChild(buildNumber);

        // changelog
        let changelog = document.createElement("p");
        changelog.classList.add("content-header");
        changelog.innerHTML = `Changelog:&nbsp;&nbsp;&nbsp;<br>`;
        let changelogValue = document.createElement("p");
        changelogValue.classList.add("font-ntype82-mono");
        changelogValue.innerHTML = item.changelog;
        changelog.appendChild(changelogValue);
        list.appendChild(changelog);

        // download
        // ota

        if (ota_images !== undefined) {
            let downloadHeader = document.createElement("p");
            downloadHeader.classList.add("content-header");
            downloadHeader.innerHTML = `OTA:<br>`;
            list.appendChild(downloadHeader);

            let downloadDiv = document.createElement("div");
            downloadDiv.classList.add("download-buttons");

            for (const ota of ota_images) {
                let download = document.createElement("a");
                download.href = ota.url;
                download.classList.add("download-button");
                if (ota.type === "incremental") {
                    download.innerHTML = "Incremental OTA from " + resloveName(ota.pre_version, json);
                }

                if (ota.type === "rollback") {
                    download.innerHTML = "Rollback OTA to " + resloveName(ota.post_version, json);
                }

                if (ota.type === "full") {
                    download.innerHTML = "Full OTA";
                }

                downloadDiv.appendChild(download);
            }
            list.appendChild(downloadDiv);
        }

        // boot
        if (boot_images !== undefined) {
            let bootHeader = document.createElement("p");
            bootHeader.classList.add("content-header");
            bootHeader.innerHTML = `Boot:<br>`;
            list.appendChild(bootHeader);
            let bootDiv = document.createElement("div");
            bootDiv.classList.add("download-buttons");
            for (let i = 0; i < boot_images.length; i++) {
                let download = document.createElement("a");
                download.classList.add("download-button");
                download.href = boot_images[i].url;
                download.innerHTML = boot_images[i].type;
                bootDiv.appendChild(download);
            }
            list.appendChild(bootDiv);
        }


        div.appendChild(list);
        main.appendChild(div);
    }

}

function resloveName(name, json) {
    let reslovedName = "";

    for (const key in json) {
        if (key === name) {
            reslovedName = json[key].name;
        }
    }

    if (reslovedName === "") {
        reslovedName = name;
    }

    return reslovedName;
}

function collapsible() {
    var coll = document.getElementsByClassName("collapsible");

    for (let i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    }
}


function view(dataName) {
    // hide all main elements
    let mains = document.getElementsByTagName("main");
    for (let i = 0; i < mains.length; i++) {
        mains[i].style.display = "none";
    }

    // show the selected main element
    let main = document.querySelector(`main[data-name="${dataName}"]`);
    main.style.display = "block";
}

function toggleMenu(hide = false, reset = false) {
    let nav = document.getElementsByTagName("nav")[0];
    // change the :root  --header-height to 52px
    let root = document.documentElement;
    let headerHeight = root.style.getPropertyValue("--header-height");
    if (headerHeight === "52px" && hide === false && reset === false) {
        root.style.setProperty("--header-height", "400px");

        // get the buttons without the class menu
        let buttons = nav.getElementsByTagName("button");
        for (let i = 0; i < buttons.length; i++) {
            if (buttons[i].classList.contains("menu") === false) {
                buttons[i].style.display = "block";
            }
        }

    } else {
        root.style.setProperty("--header-height", "52px");

        // get the buttons without the class menu
        let buttons = nav.getElementsByTagName("button");
        for (let i = 0; i < buttons.length; i++) {
            if (buttons[i].classList.contains("menu") === false) {
                // check if the screen width is less or equal to 600px
                if (window.innerWidth <= 600) {
                    buttons[i].style.display = "none";
                } else {
                    buttons[i].style.display = "block";
                }
            }
        }
    }
}

function toggleAndChangeView(name, hide)
{
    view(name);
    toggleMenu(hide);
}