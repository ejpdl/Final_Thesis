


// FUNCTION FOR DATE FORMAT
function formatDateWithSlashes(dateString){

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${month}/${day}/${year}`;

}


// TO LOAD STUDENT DATA AND INFORMATION
async function loadStudentData(){

    const token = localStorage.getItem('token');

    if(!token){

        alert(`No token found. Please Log In`);
        return;

    }

    try{

        const response = await fetch(`http://localhost:5000/student_user/view`, {

            method: 'GET',
            headers: {

                'Authorization': token

            }

        });

        if(!response.ok){

            const ErrorData = await response.json();
            console.error('Error', ErrorData);
            throw new Error(ErrorData.msg || `Failed to fetch student data`);
        }

        const data = await response.json();

        const loggedInStudentID = data.Student_ID;

        const fullname = `${data.First_Name} ${data.Last_Name}`;
        const age = `${data.Age} Years Old`;
        const gender = data.Gender;

        var typed = new Typed(".typed", {

            strings: [fullname, age, gender],
            typeSpeed: 60,
            backSpeed: 60,
            loop: true

        });

        const gradeAndsection = `${data.Grade_Level} - ${data.Section}`;
        document.querySelector(`#grade_section`).textContent = gradeAndsection;

        document.querySelector(`#aboutme`).textContent = data.About_Me;

        const demographics = document.querySelectorAll(`.demographics span`);
        demographics[0].textContent = "**/**/****"
        demographics[1].textContent = "*********@gmail.com";
        
        const formatBday = formatDateWithSlashes(data.Birthday);
        
        demographics[0].dataset.value = formatBday;
        demographics[1].dataset.value = data.Email;

        const profileImage = document.querySelector(`#profile`);

        if(data.Profile_Picture){

            profileImage.src = `http://localhost:5000/${data.Profile_Picture}`;
            profileImage.alt = `${fullname} 's Profile Picture`;

        }

        const profileAbout = document.querySelector(`#profile-about`);
        profileAbout.src = `http://localhost:5000/${data.Profile_Picture}`;

        return loggedInStudentID;

    }catch(error){

        console.log(`Error fetching: ${error}`);
        alert(`An error occured while loading the student data`);

    }

}

async function loadClassmateData(studentID){

    const token = localStorage.getItem('token');

    if(!token){

        alert(`No token found. Please Log In again`);
        return;

    }

    try{

        const response = await fetch(`http://localhost:5000/classmate/view/${studentID}`, {

            method: 'GET',
            headers: {

                'Authorization' :  token

            }

        });

        const data = await response.json();

        if(!data){

            throw new Error(`No data found`);

        }

        const profileImage = document.querySelector(`#profile-${studentID}`);

        if(data.Profile_Picture){

            profileImage.src = `http://localhost:5000/${data.Profile_Picture}`;
            profileImage.alt = `${data.First_Name}'s Profile Picture`;

        }

        document.querySelector(`#classmate-name-${studentID}`).textContent = `${data.First_Name} ${data.Last_Name}`;
        document.querySelector(`#classmate-gradesection-${studentID}`).textContent = `${data.Grade_Level} - ${data.Section}`;

        const ownerIdElement = document.querySelector(`#owner-id`);
        if (ownerIdElement) {
            ownerIdElement.textContent = data.Student_ID;  // This line ensures the owner ID reflects the current classmate's ID
        }
        
      
    }catch(error){

        console.log(error);

    }

}
async function fetchPeers(){

    const token = localStorage.getItem("token");

    try{

        const response = await fetch(`http://localhost:5000/peers/list`, {

            method: 'GET',
            headers: {

                'Authorization' :  token,
                'Content-Type'  :   'application/json',

            }

        });

        if(!response.ok){

            throw new Error(`Failed to Fetch`);

        }

        const students = await response.json();
        renderStudents(students);
        loadClassmate();


    }catch(error){

        console.log(error);

    }

}

async function renderStudents(students){

    const container = document.querySelector('.peer-container');
    container.innerHTML = ''; // Clear previous content

    students.forEach(student => {

        const studentCard = document.createElement('a');
        studentCard.href = `../Classmate_Page/classmate.html?Student_ID=${student.Student_ID}`;
        studentCard.classList.add('classmate-link');
        studentCard.dataset.studentId = student.Student_ID;


        studentCard.innerHTML = `
            <div class="peer-cards" data-student-id="${student.Student_ID}">
                <div class="image">
                    <img id="profile-${student.Student_ID}" src="${student.Profile_Picture || ''}" alt="classmate-profile">
                </div>
                <span class="peer-name" id="classmate-name-${student.Student_ID}">${student.Name || 'Name'}</span>
                <span class="peer-grade-section" id="classmate-gradesection-${student.Student_ID}">${student.Grade_Section || 'Grade and Section'}</span>
            </div>
        `;

        container.appendChild(studentCard);

    });

    const classmateLinks = document.querySelectorAll('.classmate-link');

    classmateLinks.forEach(link => {

        link.addEventListener('click', function () {

            const studentId = this.getAttribute('data-student-id');
            localStorage.setItem('classmateId', studentId);

        });

    });

}

fetchPeers();

async function loadClassmate(){

    const loggedInStudentID = await loadStudentData();
    if(!loggedInStudentID) return;

    const peerCards = document.querySelectorAll('.peer-cards');

    peerCards.forEach(card => {

        const studentID = card.getAttribute('data-student-id');

        if(studentID === loggedInStudentID){

            card.parentElement.remove();
            return;

        }

        

    });

}





// EDIT DIALOG FETCH
async function EditDialog(){

    const token = localStorage.getItem('token');

    try{

        const response = await fetch(`http://localhost:5000/student_user/view`, {

            headers: {

                'Authorization' :  token

            }

        });

        const data = await response.json();

        if(response.ok && data){

            document.querySelector(`#fname`).value = data.First_Name;
            document.querySelector(`#gender`).value = data.Gender;
            document.querySelector(`#mname`).value = data.Middle_Name;
            document.querySelector(`#lname`).value = data.Last_Name;
            document.querySelector(`#grade`).value = data.Grade_Level;
            document.querySelector(`#section`).value = data.Section;
            document.querySelector(`#email`).value = data.Email;
            document.querySelector(`#age`).value = data.Age;

            const birthdayValue = data.Birthday; 

            const date = new Date(birthdayValue);

            if(isNaN(date.getTime())){

                console.error("Invalid date:", birthdayValue);
                document.querySelector(`#bday`).value = '';
                
            }else{

                const formatDate = date.toISOString().split('T')[0];
                document.querySelector(`#bday`).value = formatDate; 

            }

            document.querySelector(`#bio`).value = data.About_Me; 

            document.querySelector(`#studentID`).value = data.Student_ID || "";
            
            showEditDialog(true);

        }else{

            console.log(`No data found or an error occured`);
            alert(`Could not retrieve user data. Please try again`);

        }


    }catch(error){

        console.log(error);
        alert(`An error occured while fetching the data`);

    }

    const update_information = document.querySelector(`#confirm-button`);

    if(update_information){

        update_information.onclick = async (e) => {

            e.preventDefault();

            const updateData = new FormData();

            updateData.append('First_Name', document.querySelector(`#fname`).value);
            updateData.append('Gender', document.querySelector(`#gender`).value);
            updateData.append('Middle_Name', document.querySelector(`#mname`).value);
            updateData.append('Last_Name', document.querySelector(`#lname`).value);
            updateData.append('Grade_Level', document.querySelector(`#grade`).value);
            updateData.append('Section', document.querySelector(`#section`).value);
            updateData.append('Email', document.querySelector(`#email`).value);
            updateData.append('Age', document.querySelector(`#age`).value);
            updateData.append('Birthday', document.querySelector(`#bday`).value);
            updateData.append('About_Me', document.querySelector(`#bio`).value);
            updateData.append('Student_ID', document.querySelector(`#studentID`).value);

            const profileImage = document.querySelector(`#profile-pic`).files[0];

            if(profileImage){

                updateData.append('image', profileImage);

            }

            try{

                const updateResponse = await fetch(`http://localhost:5000/student_user/update`, {

                    method: 'PUT',
                    body: updateData,
                    headers: {

                        'Authorization' :  token,
                        
                    }

                });

                const result = await updateResponse.json();

                if(updateResponse.ok){

                    alert(`Successfully Updated`);
                    location.reload();

                }else{

                    console.log(result.error);
                    alert(`Error updating user: ${result.error}`);

                }

            }catch(error){

                console.log(error);
                alert(`An error has occured during the update proccess. Please Try Again`);

            }

        };

    }

}

// ANCHOR - UPLOAD FILES
document.querySelector(`#uploadForm`).addEventListener("submit", async function (e){

    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const token = localStorage.getItem('token');

    try {

        const response = await fetch(form.action, {

            method: 'POST',
            body: formData,
            headers: {

                'Authorization' :  token

            }

        });

        if(response.ok){

            alert(`Successfully Uploaded`);
            location.reload();


        }else{

            alert("Error uploading file");

        }

    }catch(error){

        console.error("Error:", error);
        alert("An error occurred while uploading.");

    }
    
});


function toggleDemographics(){

    const bday = document.querySelector(`#birthday`);
    const email = document.querySelector(`#email-demographics`);
    const eyeIcon = document.querySelector(`#eye-icon`);

    const isHidden = bday.textContent === "**/**/****";

    if(isHidden){

        bday.textContent = bday.dataset.value;
        email.textContent = email.dataset.value;

    }else{

        bday.textContent = "**/**/****";
        email.textContent = "*********@gmail.com";

    }

    if(eyeIcon.classList.contains('bx-bxs-show')){

        eyeIcon.classList.remove('bx-bxs-show');
        eyeIcon.classList.add('bx-bxs-hide');

    }else{

        eyeIcon.classList.remove('bx-bxs-hide');
        eyeIcon.classList.add('bx-bxs-show');

    }

    const hideDemographics = !isHidden;
    localStorage.setItem('hideDemographics', hideDemographics);
    togglePrivacySetting(hideDemographics);

}

document.querySelector(`#toggle-eye`).addEventListener('click', toggleDemographics);


async function loadAccessRequests(){

    const token = localStorage.getItem('token');

    try{

        const response = await fetch(`http://localhost:5000/access/requests`, {

            method: 'GET',
            headers: {

                'Authorization': token,
                'Content-Type': 'application/json',

            },

        });

        if(response.ok){

            const requests = await response.json();
            const requestsContainer = document.getElementById('accessRequestsContainer');

            requestsContainer.innerHTML = '';

            requests.forEach(request => {

                const requestItem = document.createElement('div');
                requestItem.className = 'notification';
                requestItem.classList.add('request-item');
                requestItem.id = `request-${request.id}`;
                requestItem.innerHTML = `
                    <p><strong>${request.First_Name} ${request.Last_Name} </strong> has requested access to your files.</p>
                    <button class = "accept" onclick="handleAccessRequest(${request.id}, 'accept')">Accept</button>
                    <button class = "decline" onclick="handleAccessRequest(${request.id}, 'decline')">Decline</button>
                `;

                requestsContainer.appendChild(requestItem);

                let fadeTimeout;

                function startFadeOut(){

                    fadeTimeout = setTimeout(() => {

                        requestItem.style.opacity = 0;

                        setTimeout(() => {

                            requestItem.remove();

                        }, 500); 

                    }, 5000); 

                }

                requestItem.addEventListener('mouseover', () => {

                    clearTimeout(fadeTimeout);

                });
            
                requestItem.addEventListener('mouseout', () => {

                    startFadeOut();

                });

                startFadeOut();

            });

        }else{

            const result = await response.json();
            console.log('Error fetching access requests:', result.error);

        }

    }catch(error){

        console.error('Error loading access requests:', error);

    }
    
}

async function handleAccessRequest(requestID, action){

    const token = localStorage.getItem('token');
    
    try{

        const response = await fetch(`http://localhost:5000/access/request/${requestID}/${action}`, {
            
            method: 'POST',
            headers: {

                'Authorization': token,
                'Content-Type': 'application/json',

            },

        });

        if(response.ok){

            alert(`Request ${action === 'accept' ? 'accepted' : 'declined'} successfully!`);
            const requestItem = document.getElementById(`request-${requestID}`);

            if(requestItem){

                requestItem.remove();

            }

        }else{

            const result = await response.json();
            alert(`Error handling request: ${result.error}`);

        }

    }catch(error){

        console.error('Error handling access request:', error);
        alert('An error occurred while handling the access request.');

    }

}


loadAccessRequests();

