const baseURL = 'https://restcountries.herokuapp.com/api/v1/region/';
const proxy = 'https://intense-mesa-62220.herokuapp.com/';

const baseURLCovid = 'http://corona-api.com/countries/';

const tabsContainer = document.querySelector(".tabs__navbar");
const tabs = document.querySelectorAll(".tab"); 
const btns = document.querySelectorAll('.continents-btns')
tabs.forEach((tab)=> tab.addEventListener('click', changeTab, false));
btns.forEach((btn)=>btn.addEventListener('click', getContinent, false));

let currentData;
let world = {};

function changeTab(event){
    const selected = document.querySelector('.selected');
    switchSelection(selected, event.target)
    // createChart(currentData, event.target.getAttribute("name"));
}

function switchSelection(toRemove, toSelect){
    toRemove.classList.toggle('selected')
    toSelect.classList.toggle('selected')
}

async function getContinent(event){
    const continentName = event.target.getAttribute('name');

    const toRemove = document.querySelector('.selected');
    const toSelect = document.querySelector('[name="confirmed"]');
    switchSelection(toRemove, toSelect);

    if(world[continentName]){
        console.log("yeah");
        //print countries
        createChart(world[continentName], "confirmed");
        return;
    }
     
    const response = await fetch(`${proxy}${baseURL}${continentName}`);
    const data = await response.json();

    const countryCode = data.map((country) => country.cca2);

    getCovidStats(countryCode, continentName);
}

async function getCovidStats(arr, continentName){
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
    console.log(data);

    let allData ={};
    countriesNames = [];
    data.forEach((element)=>{
        countriesNames.push(element.data.name);
        allData[element.data.name] = {
            // name: element.data.name,
            // data: {
                confirmed: element.data.latest_data.confirmed,
                critical: element.data.latest_data.critical,
                deaths: element.data.latest_data.deaths,
                recovered: element.data.latest_data.recovered,
                newCases: element.data.today.confirmed,
                newDeaths: element.data.today.deaths
            // }
        }
    });
    console.log(allData);
    world[continentName] = {
        data: allData,
        countriesNames: element.data.name 
    }
    currentData = allData;
    addCountries(allData);
}

function addCountries(data){
    const selelct = document.querySelector('.countries-select');
    selelct.innerHTML = "";
    for (const key in data) {
        const option = document.createElement('option');
        option.innerText = key;
        selelct.appendChild(option);
    }
    createChart(data, "confirmed");
}

function createChart(data, subject){
    let xLabel = [];
    let yLabel = [];
    for (const key in data) {
        yLabel.push(data[key][subject]);
        xLabel.push(key);
        
    }
    const graph = document.querySelector('#chart');
    new Chart(graph, {
        type: "line",
        data: {
            labels: xLabel,
            datasets: [{
                data: yLabel,

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


// getContinent();