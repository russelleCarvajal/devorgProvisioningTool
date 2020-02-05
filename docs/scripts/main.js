const clientId = '83d37bf5-e050-47bf-9937-0314b259c9c4';
const redirectUri = window.location.href;
const platformClient = require('platformClient');
const client = platformClient.ApiClient.instance;

let AuthorizationApi = new platformClient.AuthorizationApi();
let TelephonyProvidersEdgeApi = new platformClient.TelephonyProvidersEdgeApi();
let locationsApi = new platformClient.LocationsApi();

let entryIndicator = "";

// Set PureCloud settings
client.setEnvironment('mypurecloud.com');
$(document).ready(() => {
  client.loginImplicitGrant(clientId, redirectUri)
    .then(() => {
      console.log('Logged in');
      let token = client.authData.accessToken;
    })
    .catch((err) => console.error(err));
})

function listProducts() {
  let products = [];
  AuthorizationApi.getAuthorizationProducts()
    .then((data) => {
      console.log(`getAuthorizationProducts success! data: ${JSON.stringify(data, null, 2)}`);
      products = data.entities;
      checkBYOC(products);
    })
    .catch((err) => {
      console.log('There was a failure calling getAuthorizationProducts');
      console.error(err);
    });

}

function checkBYOC(products) {
  let byoc = ""
  products.forEach(product => {
    if (product.id == "byoc") {
      byoc = product.id;
    }

  });

  if (byoc != "") {
    $("#byocenableModal").modal();
  } else {
    $("#byocdisableModal").modal();
  }


}

function validateCreateTrunk() {
  
  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  let forms = document.getElementsByClassName('needs-validation');
  // Loop over them and prevent submission
  let validation = Array.prototype.filter.call(forms, function (form) {
    form.addEventListener('submit', function (event) {
      if (form.checkValidity() === false) {
        entryIndicator = 0;
        event.preventDefault();
        event.stopPropagation();
  
      }
      else if (form.checkValidity() === true)  {
        entryIndicator = 1;
      } 
      form.classList.add('was-validated');
    }, true)
  })

  if(entryIndicator ==1) {
    createTrunk();
  }

}


function createTrunk() {

  $('#sipModal').modal('hide');
  let trunkBody = {

    name: document.getElementById('txtSIPExternalTrunk').value, // External Trunk Name
    state: "active",
    trunkMetabase: {
      id: "external_sip_pcv_byoc_carrier.json",
      name: "Generic BYOC Carrier"
    },
    properties: {
      trunk_type: {
        type: "string",
        value: {
          default: "external.pcv.byoc.carrier",
          instance: "external.pcv.byoc.carrier"
        }
      },
      trunk_label: {
        type: "string",
        value: {
          default: "Generic BYOC Carrier",
          instance: "Sample Trunk"
        }
      },
      trunk_enabled: {
        type: "boolean",
        value: {
          default: true,
          instance: true
        }
      },

      trunk_transport_serverProxyList: {
        type: "array",
        items: {
          type: "string"
        },
        uniqueItems: true,
        value: {
          default: null,
          instance: [document.getElementById('txtSIPServers').value] //SIP Servers or Proxies
        },
        required: true
      },
      trunk_access_acl_allowList: {
        type: "array",
        items: {
          type: "string"
        },
        value: {
          default: [],
          instance: ["54.172.60.0/23", "34.203.250.0/23", "54.244.51.0/24", "54.65.63.192/26", "3.112.80.0/24",
            "54.169.127.128/26", "3.1.77.0/24"
          ]
        }
      },
      trunk_protocol: {
        type: "string",
        enum: ["SIP"],
        value: {
          default: "SIP",
          instance: "SIP"
        }
      },

      trunk_sip_authentication_credentials_realm: {
        type: "string",
        value: {
          default: "",
          instance: document.getElementById('txtSIPRealm').value // Realm
        }
      },
      trunk_sip_authentication_credentials_username: {
        type: "string",
        value: {
          default: "",
          instance: document.getElementById('txtUserName').value // User Name
        }
      },
      trunk_sip_authentication_credentials_password: {
        type: "string",
        value: {
          default: "",
          instance: document.getElementById('txtSIPPassword').value // Password
        }
      },
      trunk_outboundIdentity_callingName: {
        type: "string",
        pattern: "^[\\S ]{0,40}$",
        value: {
          default: "",
          instance: document.getElementById('txtSIPCallingName').value // Calling Name
        }
      },
      trunk_outboundIdentity_callingName_overrideMethod: {
        type: "string",
        enum: ["Always", "Unassigned DID"],
        value: {
          default: "Always",
          instance: "Always"
        }
      },
      trunk_outboundIdentity_callingAddress: {
        type: "string",
        value: {
          default: "",
          instance: document.getElementById('txtSIPCallingAddress').value // Calling Address
        }
      },
      trunk_outboundIdentity_callingAddress_overrideMethod: {
        type: "string",
        enum: ["Always", "Unassigned DID"],
        value: {
          default: "Always",
          instance: "Always"
        }
      },
      trunk_outboundIdentity_calledAddress_omitPlusPrefix: {
        type: "boolean",
        value: {
          default: false,
          instance: false
        }
      },
      trunk_outboundIdentity_callingAddress_omitPlusPrefix: {
        type: "boolean",
        value: {
          default: false,
          instance: false
        }
      },
      trunk_sip_termination_uri: {
        type: "string",
        value: {
          instance: document.getElementById('txtInboundSIP').value // Inbound SIP Termination Identifier
        },
        required: false
      }

    },
    trunkType: "EXTERNAL"


  }; // Object | Trunk base settings

  TelephonyProvidersEdgeApi.postTelephonyProvidersEdgesTrunkbasesettings(trunkBody)
    .then((trunkData) => {
      $("#sipStatusModalSuccess").modal();
      console.log(
        `postTelephonyProvidersEdgesTrunkbasesettings success! data: ${JSON.stringify(trunkData, null, 2)}`);          
    })
    .catch((err) => {
      $("#sipStatusFailed").modal();
      document.getElementById("trunkErrorMessage").innerHTML =  err.body.message;
      console.log('There was a failure calling postTelephonyProvidersEdgesTrunkbasesettings');
      console.error(err);
      console.error(err.body.message);
    });


}

$('#sipModal').on('hidden', function() {
  $(this).removeData('modal');
});


$("#createLocation").click(function () {
  // get country value and text
  let cntryOption = document.getElementById("country");
  let cntryValue = cntryOption.options[cntryOption.selectedIndex].value;
  let cntryText = cntryOption.options[cntryOption.selectedIndex].text;
  // formulate the body of the request
  let body = {
    "name": $("#location").val(),
    "address": {
      "street1": $("#address").val(),
      "city": $("#city").val(),
      "state": $("#state").val(),
      "zipcode": $("#zip").val(),
      "country": cntryValue,
      "countryFullName": cntryText
    }
  }
  locationsApi.postLocations(body)
    .then((data) => {
      console.log(`postLocations success! data: ${JSON.stringify(data, null, 2)}`);
      $('#formCreateTrunk').reset();
      $("#locationStatusModal ").modal();
    })
    .catch((err) => {
      console.log('There was a failure calling postLocations');
      console.error(err);
    });
})

//   Create Site Functions 
$('#siteModal').on('show.bs.modal', function() {
  getTimezone();
  getLocationList();
})

// Get time zone and add to select option 
function getTimezone () {
  let opts = { 
  'pageSize': 1000,
  'pageNumber': 1
  };

  TelephonyProvidersEdgeApi.getTelephonyProvidersEdgesTimezones(opts)
  .then((data) => {
    let timezone = data.entities;
    timezone.forEach(addTimezoneToSelect);
  })
  .catch((err) => {
    console.log('There was a failure calling getTimezones');
    console.error(err);
  });
}

// format timezone
function addTimezoneToSelect(timeZone)
{ 
  let select = document.getElementById("timeZone");
  let option = document.createElement("option");
  
  let thisTime = timeZone.offset;
  let country = timeZone.id;  
  let hours = Math.floor(thisTime / 60);  
  // fomrat minutes
  let minutes = formatNumber(Math.abs(thisTime) % 60);
  let timeZoneFormat = country+"("+ hours + ":" + minutes +")"; 

  option.text = timeZoneFormat;
  option.value = country;
  select.add(option);
}
function formatNumber (n) {
  return n > 9 ? "" + n: "0" + n;
}

// Create location dropdown option
function getLocationList () {
  let opts = { 
    'pageSize': 100, 
    'pageNumber': 1, 
    'sortOrder': "name" 
  };
  locationsApi.getLocations(opts)
  .then((data) => {
    let location = data.entities;
    console.log(location)
    location.forEach(locationOption);
  })
  .catch((err) => {
    console.log('There was a failure calling getLocations');
    console.error(err);
  });
}
// Create Location dropdown
function locationOption (location) {
  let name = document.getElementById("siteLocation");
  let option = document.createElement("option");
  option.text = location.name;
  option.value = location.id;
  name.add(option);
}

// Get the site list and find default site --PureCloud Voice - AWS-- which is used as Primary Site and Secondary Sites then create sites
function getSites () {
  let opts = { 
    'pageSize': 25,
    'pageNumber': 1,
    'sortBy': "name",
    'sortOrder': "ASC",
  };
  TelephonyProvidersEdgeApi.getTelephonyProvidersEdgesSites(opts)
  .then((data) => {
    let awsItem = data.entities.find(entitiesItem => entitiesItem.name === "PureCloud Voice - AWS");
    let locationId = $("#siteLocation").val();

    locationsApi.getLocation(locationId)
    .then((locInfo) => {
      createSite(awsItem, locInfo);
    })
    .catch((err) => {
      console.log('There was a failure calling getLocation');
      console.error(err);
    });
  })
  .catch((err) => {
    console.log('There was a failure calling getTelephonyProvidersEdgesSites');
    console.error(err);
  });
}


// Create the site 
function createSite (awsItem, locInfo) {
  // get information of the site
  let awsItemId = awsItem.id;
  let awsItemName = awsItem.name;
  let awsItemSelfUri = awsItem.selfUri;
  // get the date
  let today = new Date();
  dateConfig = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  startDateConfig = dateConfig+"T02:00:00.000";
  endDateConfig = dateConfig+"T05:00:00.000";
  
  let body = {
    "name": $("#siteName").val(),
    "primarySites": [
        {
          "id": awsItemId,
          "name": awsItemName,
          "selfUri": awsItemSelfUri
        }
    ],
    "secondarySites": [
        {
          "id": awsItemId,
          "name": awsItemName,
          "selfUri": awsItemSelfUri
        }
    ],
    "edgeAutoUpdateConfig": {
          "timeZone": $("#timeZone").val(),
          "rrule": "FREQ=DAILY",
          "start": startDateConfig,
          "end": endDateConfig

        },
    "location": locInfo,
    "ntpSettings": {
        "servers": []
    }
  };

  TelephonyProvidersEdgeApi.postTelephonyProvidersEdgesSites(body)
  .then((data) => {
    console.log(data);
    $("#siteAndLocationStatusModal ").modal();
  })
  .catch((err) => {
    console.log('There was a failure calling postTelephonyProvidersEdgesSites');
    console.error(err);
  });
}


$("#gotoLocation").click(function () {
  $.ajax({
    // Get countries via API
    url: "https://restcountries.eu/rest/v2/all?fields=name;callingCode;alpha3Code",
    success: function (result) {
      let countryList = result;
      countryList.forEach(createList)
    }
  });
  
})

function createList(item) {
let name = document.getElementById("country");
let option = document.createElement("option");
option.text = item.name;
option.value = item.alpha3Code;
name.add(option);
}