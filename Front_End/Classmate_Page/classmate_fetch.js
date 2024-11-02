// FORMAT DATE
function formatDate(dateString){

    const date = new Date(dateString);

    if (!isNaN(date.getTime())){

        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear(); 

        return `${month}/${day}/${year}`;

    }else{

        console.error("Invalid date:", dateString);
        return '';

    }

}

// TO DISPLAY THE INFORMATION OF THE STUDENT CLASSMATE
async function loadClassmateData(){

    const urlParams = new URLSearchParams(window.location.search);
    const studentID = urlParams.get('Student_ID');

    if(!studentID){

        alert(`No Student ID Provided`);
        return;

    }

    const token = localStorage.getItem('token');
    console.log('Token:', token);

    if(!token){

        alert(`No authentication token found. Please Log In again`);
        return;

    }

    try{

        const response = await fetch(`http://localhost:5000/classmate/view/${studentID}`, {

            method: 'GET',
            headers: {

                'Authorization' : token

            }

        });

        const data = await response.json();

        if(!data){

            throw new Error(`No data found for the specified student`);

        }

        const profileImage = document.querySelector(`#profile`);

        if(data.Profile_Picture){

            profileImage.src = `http://localhost:5000/${data.Profile_Picture}`;
            profileImage.alt = `${data.First_Name}'s Profile Picture`;

        }

        
        document.querySelector(`#classmate-name`).textContent = `${data.First_Name} ${data.Last_Name}`;
        const gradeAndsection = `${data.Grade_Level} - ${data.Section}`;
        document.querySelector(`#gradesection`).textContent= gradeAndsection;
        document.querySelector(`#bio`).textContent = data.About_Me;

        const demographics = document.querySelectorAll(`.demographics span`);
        if (data.hide_demographics){

            demographics[0].textContent = "**/**/****"; 
            demographics[1].textContent = "**********@gmail.com";

        }else{

            demographics[0].textContent = formatDate(data.Birthday);
            demographics[1].textContent = data.Email;

        }

        if(studentID === token){

            loadQuizzes(token);

        }

    }catch(error){

        console.log(`Error fetching classmate data ${error}`);
        alert(`An error occured while loading classmate data`);

    }

}

loadClassmateData();

