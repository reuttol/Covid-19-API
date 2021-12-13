const baseURLCountries = 'https://restcountries.herokuapp.com/api/v1/';
const region = 'region/';
const baseURLCovid = 'http://corona-api.com/countries/';
const proxy = 'https://intense-mesa-62220.herokuapp.com/';

const tabsContainer = document.querySelector(".tabs__navbar");
const tabs = document.querySelectorAll(".tab"); 
const btns = document.querySelectorAll('.continent-btn')
const dropDown = document.querySelector('.countries-select');
const spinner = document.querySelector('.spinner-container');
const initialTab = "confirmed";

let world = {};
let current = null;
let chart = null;
let countries = null;

function toggleSpinner(){
    spinner.classList.toggle('hidden');
}
function addAllEventListeners(){
    tabs.forEach((tab)=> tab.addEventListener('click', changeTab, false));
    btns.forEach((btn)=> btn.addEventListener('click', handleContinent, false));
    dropDown.addEventListener('change', diaplayCountryStats, false);

}
function removeAllEventListeners(){
    tabs.forEach((tab)=> tab.removeEventListener('click', changeTab));
    btns.forEach((btn)=> btn.removeEventListener('click', handleContinent));
    dropDown.removeEventListener('change', diaplayCountryStats);
}

function diaplayCountryStats(event){
    removeAllEventListeners();
    const countryStats = document.querySelector('.country-stats');
    countryStats.classList.remove('hidden');
    const selectedCountry = event.target.value;
    
    let curCountry;
    if(current === "world"){
        for(key in world){
            if(selectedCountry in world[key].data)
                curCountry = world[key].data[selectedCountry];
        }
    }
    else
        curCountry = world[current].data[selectedCountry];
    const containers = document.querySelectorAll('.container');
   
    let i=0;
    for(const key in curCountry){
        containers[i].children[0].innerText = key;
        containers[i].children[1].innerText = curCountry[key];
        i++;
    }
    // dropDown.disabled = false;
    addAllEventListeners();
}

function changeTab(event){
    removeAllEventListeners();
    toggleSpinner();
    dropDown.disabled = true;

    const selected = document.querySelector('.selected');
    switchSelection(selected, event.target)
    if(current==="world")
        drawWorldChart(event.target.getAttribute("name"));
    else
        drawContinentChart(world[current], event.target.getAttribute("name"));

    dropDown.disabled = false;
    toggleSpinner();
    addAllEventListeners();
}

function switchSelection(toRemove, toSelect){
    toRemove.classList.toggle('selected')
    toSelect.classList.toggle('selected')
}

async function handleContinent(event){
    removeAllEventListeners();
    dropDown.disabled = true;
    toggleSpinner();
    const countryStats = document.querySelector('.country-stats');
    countryStats.classList.add('hidden');
    const continentName = event.target.getAttribute('name');
    current = continentName;

    const toRemove = document.querySelector('.selected');
    const toSelect = document.querySelector(`[name="${initialTab}"]`);
    switchSelection(toRemove, toSelect);

    if(continentName === 'world'){
       await displayAllContinentsData(); 
    }
    else
       await displayContinentData(continentName);
    
    addAllEventListeners();
}
async function displayAllContinentsData(){
    const remaining = remainingContinentsArray();

    await Promise.all(
        remaining.map(async (continent) => {
          const countriesCodes = await getCountriesInContinent(continent);
          await getCountriesCovidStats(countriesCodes, continent);
        })
    );
    
    if(!countries){
        let temp = [];
        for (const key in world) {
            temp.push(...world[key].countriesNames);
        }
        countries = temp.sort();
    }
    
    dropDown.disabled = false;
    displayCountriesNames(countries);
    drawWorldChart(initialTab);
    toggleSpinner();
}
async function displayContinentData(continentName){
    if(world[continentName]){
        dropDown.disabled = false;
        displayCountriesNames(world[continentName].countriesNames);
        drawContinentChart(world[continentName], initialTab);
        toggleSpinner();
        return;
    }

    const countriesCodes = await getCountriesInContinent(continentName);
    await getCountriesCovidStats(countriesCodes, continentName);

    dropDown.disabled = false;
    displayCountriesNames(world[continentName].countriesNames);
    drawContinentChart(world[continentName], initialTab);
    toggleSpinner();
}

async function getCountriesInContinent(continentName){
    const response = await fetch(`${proxy}${baseURLCountries}${region}${continentName}`);
    const data = await response.json();

    return data.map((country) => country.cca2);
}

async function getCountriesCovidStats(arr, continentName){
    for (let i = 0; i < arr.length; i++) {
        arr[i] = fetch(`${proxy}${baseURLCovid}${arr[i]}`);  
    }
    let data = [];
    const responses = await Promise.all(arr)
    responses.forEach((element)=>{
        if(!element.ok)
            console.log("Error:", element);
        else
            data.push(element.json())
    });
    data = await Promise.all(data); 

    let allData ={};
    countriesNames = [];
    data.forEach((element)=>{
        countriesNames.push(element.data.name);
        allData[element.data.name] = {
            confirmed: element.data.latest_data.confirmed,
            critical: element.data.latest_data.critical,
            deaths: element.data.latest_data.deaths,
            recovered: element.data.latest_data.recovered,
            newCases: element.data.today.confirmed,
            newDeaths: element.data.today.deaths
        }
    });

    world[continentName] = {
        data: allData,
        countriesNames: countriesNames.sort() 
    }
}

function displayCountriesNames(countriesArr){
    // const select = document.querySelector('.countries-select');
    dropDown.innerHTML = "";
    const first = document.createElement('option');
    first.innerText = "Choose Country";
    first.value = null;
    dropDown.appendChild(first)
    countriesArr.forEach((country) =>{
        const option = document.createElement('option');
        option.innerText = country;
        option.value = country;
        dropDown.appendChild(option);
    });
}

function drawChart(labels, chartData, subject){
    if(chart)
        chart.destroy();
       
    const graph = document.querySelector('#chart');
    chart = new Chart(graph, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: `${current[0].toUpperCase()}${current.slice(1)}: ${subject}`,
                data: chartData,
                // color: "blue",
                borderColor: "#22A6A6",
                hoverBorderColor: "red",
                borderWidth: 1,
            },
            ],
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                yAxes: [
                    {
                        ticks: {
                            fontColor: "#AE3D3D",
                            beginAtZero: true,
                        },
                    },
                ],
                xAxes: [
                    {
                        ticks: {
                            fontColor: "#AE3D3D",
                        },
                    },
                ],
            },
        },
    });
}
function drawContinentChart(continentObj, subject){
    let yLabel = [];
    for (const key in continentObj.data) {
        yLabel.push(continentObj.data[key][subject]);       
    }
    
    drawChart(continentObj.countriesNames, yLabel, subject);
}
function drawWorldChart(subject){
    let yLabel = [];
    for(const continent in world){
        for (const country in world[continent].data) {
            yLabel.push(world[continent].data[country][subject]);       
        }
    }
    
    drawChart(countries, yLabel, subject);
    
}
function remainingContinentsArray(){
    const b = [...btns];
    const d =  b.filter((btn)=> btn.getAttribute('name')!=='world').map((btn)=>btn.getAttribute('name'));
    const filtered = d.filter((n) => !(n in world))
    return filtered;
}

addAllEventListeners();