const baseURL = 'https://restcountries.herokuapp.com/api/v1/';
const region = 'region/';
const proxy = 'https://intense-mesa-62220.herokuapp.com/';

const baseURLCovid = 'http://corona-api.com/countries/';

const tabsContainer = document.querySelector(".tabs__navbar");
const tabs = document.querySelectorAll(".tab"); 
const btns = document.querySelectorAll('.continent-btn')
tabs.forEach((tab)=> tab.addEventListener('click', changeTab, false));
btns.forEach((btn)=>btn.addEventListener('click', handleContinent, false));

const se = document.querySelector('.countries-select');
se.addEventListener('change', diaplayCountryStats, false);

function diaplayCountryStats(event){
    const countryStats = document.querySelector('.country-stats');
    countryStats.classList.remove('hidden');
    const curCountry = world[current].data[event.target.value];
    const containers = document.querySelectorAll('.container');
   
    let i=0;
    for(const key in curCountry){
        containers[i].children[0].innerText = key;
        containers[i].children[1].innerText = curCountry[key];
        i++;
    }
    
}

let world = {};
let current = null;
let chart = null;

function changeTab(event){
    const selected = document.querySelector('.selected');
    switchSelection(selected, event.target)
    if(current==="world")
        drawWorldChart(event.target.getAttribute("name"));
    else
        drawContinentChart(world[current], event.target.getAttribute("name"));
}

function switchSelection(toRemove, toSelect){
    toRemove.classList.toggle('selected')
    toSelect.classList.toggle('selected')
}

async function handleContinent(event){
    const countryStats = document.querySelector('.country-stats');
    countryStats.classList.add('hidden');
    const continentName = event.target.getAttribute('name');
    current = continentName;

    const toRemove = document.querySelector('.selected');
    const toSelect = document.querySelector('[name="confirmed"]');
    switchSelection(toRemove, toSelect);

    if(continentName === 'world'){
        console.log("1");
        displayAllContinentsData();
    }
    else
        displayContinentData(continentName)
}
async function displayAllContinentsData(){
    
    const remaining = remainingContinentsArray();
    console.log("2",remaining);

    await Promise.all(
        remaining.map(async (continent) => {
          const countriesCodes = await getCountriesInContinent(await continent);
          await getCountriesCovidStats(countriesCodes, continent);
        })
    );
   
    // let d = [];
    // for (const key in world) {
    //     d.push(...world[key].countriesNames);
    // }
    // world.allCountries = d;
    console.log(world);
    drawWorldChart("confirmed");
}
async function displayContinentData(continentName){
    if(world[continentName]){
        displayCountriesNames(world[continentName].countriesNames);
        drawContinentChart(world[continentName], "confirmed");
        return;
    }

    const countriesCodes = await getCountriesInContinent(continentName);
    await getCountriesCovidStats(countriesCodes, continentName);

    displayCountriesNames(world[continentName].countriesNames);
    drawContinentChart(world[continentName], "confirmed");
}

async function getCountriesInContinent(continentName){
    const response = await fetch(`${proxy}${baseURL}${region}${continentName}`);
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
            console.log("this", element);
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
        countriesNames: countriesNames 
    }
}

function displayCountriesNames(countriesArr){
    const select = document.querySelector('.countries-select');
    select.innerHTML = "";
    const first = document.createElement('option');
    first.innerText = "Choose Country";
    first.value = null;
    select.appendChild(first)
    countriesArr.forEach((country) =>{
        const option = document.createElement('option');
        option.innerText = country;
        option.value = country;
        select.appendChild(option);
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

                borderWidth: 1,
            },
            ],
        },
        options: {
            scales: {
                yAxes: [
                    {
                        ticks: {
                            beginAtZero: true,
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
    let d = [];
    for (const key in world) {
        d.push(...world[key].countriesNames);
    }

    let yLabel = [];
    for(const continent in world){
        for (const country in world[continent].data) {
            yLabel.push(world[continent].data[country][subject]);       
        }
    }
    
    
        drawChart(d, yLabel, subject);
    
}
function remainingContinentsArray(){
    const b = [...btns];
    const d =  b.filter((btn)=> btn.getAttribute('name')!=='world').map((btn)=>btn.getAttribute('name'));
    const filtered = d.filter((n) => !(n in world))
    return filtered;
}