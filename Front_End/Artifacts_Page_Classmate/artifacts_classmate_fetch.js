document.addEventListener("DOMContentLoaded", async () => {

    const filterbuttons = document.querySelectorAll(`.filter-buttons button`);
    const requestAccessButton = document.querySelector(`#requestAccessButton`);
    const accessStatusMessage = document.querySelector("#accessStatusMessage");

    const classmateID = localStorage.getItem('classmateId'); 

    requestAccessButton.addEventListener('click', async () => {

        accessStatusMessage.textContent = "Access requested. Waiting for the approval of the owner...";
        await requestAccess(classmateID);

        const accessGranted = await checkAccessStatusWithRetry(classmateID, 5);

        if(accessGranted === "accepted"){

            accessStatusMessage.textContent = "Access granted! Enjoy...";
            await loadClassmateFiles();

        }else if(accessGranted === "declined"){

            accessStatusMessage.textContent = "I'm Sorry but, Owner doesn't want to grant you access. Please try again later.";

        }else{

            accessStatusMessage.textContent = "I'm Sorry but, Owner doesn't want to grant you access. Please try again later.";

        }

    });

    const filtercards = e => {

        document.querySelector(`.active`)?.classList.remove("active");
        e.target.classList.add("active");

        const filterValue = e.target.dataset.name.toLowerCase();
        const filterablecards = uploadedImagesContainer.querySelectorAll(`.card`);

        filterablecards.forEach(card => {

            const cardSubject = card.dataset.name.toLowerCase();

            if(filterValue === "all" || cardSubject === filterValue){

                card.classList.remove("hide");

            }else{

                card.classList.add("hide");

            }

        });

    };

    filterbuttons.forEach(button => button.addEventListener("click", filtercards));

});

async function checkAccessStatus(classmateID){

    const token = localStorage.getItem("token");

    try{

        const response = await fetch(`http://localhost:5000/check/access/${classmateID}`, {

            method: 'GET',
            headers: { 

                'Authorization' : token 

            }

        });

        if(!response.ok){

            if(response.status === 404){

                console.error('No access request found for this classmate.');
                return false;

            }else{

                console.error('Failed to fetch access status:', response.statusText);
                return false;

            }

        }

        const result = await response.json();
        return result.status;

    }catch(error){

        console.error('Error checking access status:', error);
        return false;

    }

}

async function checkAccessStatusWithRetry(classmateID, maxRetries){

    let attempts = 0;
    const retryDelay = 5000;

    while(attempts < maxRetries){

        const accessGranted = await checkAccessStatus(classmateID);

        if(accessGranted === "accepted"){

            return 'accepted';

        }else if(accessGranted === "declined"){

            return 'declined';

        }else if(accessGranted === "pending"){

            console.log(`Access still pending. Attempt ${attempts + 1} of ${maxRetries}. Retrying in ${retryDelay / 1000} seconds...`);
            attempts++;
            await new Promise(resolve => setTimeout(resolve, retryDelay));

        }else{

            console.log('Access request not found or failed to fetch status.');
            return "not_found";

        }


    }

    console.log('Access still not granted after maximum retries.');
    return "pending";

}

async function loadClassmateFiles(){

    const studentID = localStorage.getItem('classmateId');
    const token = localStorage.getItem('token');

    if(!studentID){

        console.log(`No classmate ID found in local storage`);
        return;

    }

    try{

        const response = await fetch(`http://localhost:5000/view/classmate/artifacts/${studentID}`, {

            method: 'GET',
            headers: {
            
                'Authorization' : token 

            }

        });

        if(response.ok){

            const { quizzes, performanceTasks, assignments, seatworks, examPapers } = await response.json();

            const uploadedImagesContainer = document.querySelector(`#uploadedImagesContainer`);

            uploadedImagesContainer.innerHTML = '';

            if(quizzes.length > 0){

                quizzes.forEach(file => {

                    const fileUrl = `http://localhost:5000/${file.File}`;
                    addImageCard(fileUrl, file);

                });

            }else{

                uploadedImagesContainer.innerHTML += "<p> No quizzes found </p>";

            }

            if(performanceTasks.length > 0){

                performanceTasks.forEach(file => {

                    const fileUrl = `http://localhost:5000/${file.File}`;
                    addImageCard(fileUrl, file);

                });

            }else{

                uploadedImagesContainer.innerHTML += "<p> No performance tasks found </p>";

            }

            if(assignments.length > 0){

                assignments.forEach(file => {

                    const fileUrl = `http://localhost:5000/${file.File}`;
                    addImageCard(fileUrl, file);

                });

            }else{

                uploadedImagesContainer.innerHTML += "<p> No Assignment found </p>";

            }

            if(seatworks.length > 0){

                seatworks.forEach(file => {

                    const fileUrl = `http://localhost:5000/${file.File}`;
                    addImageCard(fileUrl, file);

                });

            }else{

                uploadedImagesContainer.innerHTML += "<p> No Seatwork found </p>";

            }

            if(examPapers.length > 0){

                examPapers.forEach(file => {

                    const fileUrl = `http://localhost:5000/${file.File}`;
                    addImageCard(fileUrl, file);

                });

            }else{

                uploadedImagesContainer.innerHTML += "<p> No Examination Papers found </p>";

            }

        }else{

            console.log(`Error fetching classmates files`);

        }

    }catch(error){

        console.log(error);

    }

}

function addImageCard(fileUrl, fileData){

    const uploadedImagesContainer = document.querySelector(`#uploadedImagesContainer`);
    const OwnerName = `${fileData.First_Name} ${fileData.Last_Name}`;
    document.querySelector(`#owner-name`).textContent = `${OwnerName}'s Property`;

    const card = document.createElement("div");
    card.classList.add("card");
    const subjectName = (fileData.Subject && typeof fileData.Subject === 'string') 
        ? fileData.Subject.toLowerCase() 
        : "unknown";
    card.setAttribute("data-name", subjectName);

    let fileType;

    if (fileUrl.match(/\.(jpeg|jpg|png)$/)){

        fileType = document.createElement("img");
        fileType.src = fileUrl;
        fileType.alt = "Images";

    }else if(fileUrl.match(/\.(mp4|avi|mkv)$/)){

        fileType = document.createElement("video");
        fileType.src = fileUrl;
        fileType.controls = true;
        fileType.width = 700;
        fileType.height = 250;

    }else if(fileUrl.match(/\.pdf$/)){

        const pdfLink = document.createElement("a");
        pdfLink.href = fileUrl;
        pdfLink.target = "_blank";
        const pdfIcon = document.createElement("img");
        pdfIcon.src = "../assets/image_placeholders/pdf.png";
        pdfIcon.alt = "PDF icon";
        pdfLink.appendChild(pdfIcon);
        fileType = pdfLink;

    }else{

        const pdfLink = document.createElement("a");
        pdfLink.href = fileUrl;
        pdfLink.target = "_blank";
        const pdfIcon = document.createElement("img");
        pdfIcon.src = "../assets/image_placeholders/pdf.png";
        pdfIcon.alt = "PDF icon";
        pdfLink.appendChild(pdfIcon);
        fileType = pdfLink;

    }

    const cardBody = document.createElement("div");
    cardBody.classList.add("card-body");

    const title = document.createElement("h6");
    title.classList.add("card-title");
    title.textContent = fileData.Title;

    const gradeText = document.createElement("p");
    gradeText.classList.add("card-grade");
    gradeText.textContent = `Grade: ${fileData.Grade || 'N/A'}`;

    const uploader = document.createElement("h6");
    uploader.classList.add("card-text");
    uploader.textContent = `Uploaded by: ${fileData.First_Name} ${fileData.Last_Name}`;

    cardBody.appendChild(title);
    cardBody.appendChild(gradeText);
    cardBody.appendChild(uploader);
    card.appendChild(fileType);
    card.appendChild(cardBody);

    uploadedImagesContainer.appendChild(card);

}

async function requestAccess(classmateID){

    const token = localStorage.getItem('token');

    try{

        const response = await fetch(`http://localhost:5000/request/access`, {

            method: 'POST',
            headers: {

                'Authorization' : token,
                'Content-Type'  : 'application/json',

            },
            body: JSON.stringify({classmateID}),

        });

        if(response.ok){

            alert('Access request sent successfully!');

        }else{

            const result = await response.json();
            alert(`Error sending request: ${result.error}`);

        }

    }catch(error){

        console.error('Error sending access request:', error);
        alert('An error occurred while sending the access request.');

    }

}
