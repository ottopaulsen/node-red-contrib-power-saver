"use strict";(self.webpackChunknode_red_contrib_power_saver=self.webpackChunknode_red_contrib_power_saver||[]).push([[745],{7951:(e,n,s)=>{s.r(n),s.d(n,{data:()=>t});const t={key:"v-677dfaed",path:"/nodes/ps-receive-price.html",title:"ps-receive-price",lang:"en-US",frontmatter:{prev:"./ps-strategy-lowest-price.md"},excerpt:"",headers:[{level:2,title:"Description",slug:"description",children:[]},{level:2,title:"Configuration",slug:"configuration",children:[]},{level:2,title:"Input",slug:"input",children:[{level:3,title:"Tibber input",slug:"tibber-input",children:[]},{level:3,title:"Nord Pool input",slug:"nord-pool-input",children:[]},{level:3,title:"Other input",slug:"other-input",children:[]}]},{level:2,title:"Output",slug:"output",children:[]}],filePathRelative:"nodes/ps-receive-price.md",git:{updatedTime:1640034618e3,contributors:[{name:"Otto Paulsen",email:"ottpau@gmail.com",commits:3}]}}},546:(e,n,s)=>{s.r(n),s.d(n,{default:()=>de});var t=s(6252),r=s(3301);const a=(0,t._)("h1",{id:"ps-receive-price",tabindex:"-1"},[(0,t._)("a",{class:"header-anchor",href:"#ps-receive-price","aria-hidden":"true"},"#"),(0,t.Uk)(" ps-receive-price")],-1),l=(0,t._)("p",null,[(0,t._)("img",{src:r,alt:"ps-receive-price"})],-1),o=(0,t._)("h2",{id:"description",tabindex:"-1"},[(0,t._)("a",{class:"header-anchor",href:"#description","aria-hidden":"true"},"#"),(0,t.Uk)(" Description")],-1),i=(0,t._)("p",null,[(0,t.Uk)("The "),(0,t._)("code",null,"ps-receive-price"),(0,t.Uk)(" node is used to convert prices from Tibber or Nord Pool to the format used by the strategy nodes. It takes its input directly from the output of the following nodes (see details below):")],-1),u=(0,t._)("ul",null,[(0,t._)("li",null,[(0,t._)("code",null,"tibber-query"),(0,t.Uk)(" node from Tibber ("),(0,t._)("code",null,"node-red-contrib-tibber-api"),(0,t.Uk)(")")]),(0,t._)("li",null,[(0,t._)("code",null,"current state"),(0,t.Uk)(" node in Home Assistant")]),(0,t._)("li",null,[(0,t._)("code",null,"events: state"),(0,t.Uk)(" node in Home Assistant")])],-1),p=(0,t._)("p",null,[(0,t.Uk)("Output can be sent directly to the strategy nodes (for example "),(0,t._)("code",null,"strategy-best-save"),(0,t.Uk)(" or "),(0,t._)("code",null,"strategy-lowest-price"),(0,t.Uk)("), or it can be sent via another node to add grid tariff or other additional costs before the calculation is done.")],-1),c=(0,t._)("div",{class:"custom-container warning"},[(0,t._)("p",{class:"custom-container-title"},"Note"),(0,t._)("p",null,[(0,t.Uk)("In version 2 of "),(0,t._)("code",null,"node-red-contrib-power-saver"),(0,t.Uk)(", prices were received directly by the Power Saver node. This made it hard to add grid tariff before the calculation was done. That is why this is now a separate node.")])],-1),_=(0,t._)("h2",{id:"configuration",tabindex:"-1"},[(0,t._)("a",{class:"header-anchor",href:"#configuration","aria-hidden":"true"},"#"),(0,t.Uk)(" Configuration")],-1),b=(0,t._)("p",null,"There is no configuration except from node name.",-1),d=(0,t._)("h2",{id:"input",tabindex:"-1"},[(0,t._)("a",{class:"header-anchor",href:"#input","aria-hidden":"true"},"#"),(0,t.Uk)(" Input")],-1),h=(0,t._)("h3",{id:"tibber-input",tabindex:"-1"},[(0,t._)("a",{class:"header-anchor",href:"#tibber-input","aria-hidden":"true"},"#"),(0,t.Uk)(" Tibber input")],-1),m=(0,t.Uk)("If you are a Tibber customer, you can use the "),k=(0,t._)("code",null,"tibber-query",-1),g=(0,t.Uk)(" node from the "),f={href:"https://flows.nodered.org/node/node-red-contrib-tibber-api",target:"_blank",rel:"noopener noreferrer"},U=(0,t._)("code",null,"node-red-contrib-tibber-api",-1),y=(0,t.Uk)(". Set it up with the following query:"),v=(0,t._)("div",{class:"language-gql ext-gql line-numbers-mode"},[(0,t._)("pre",{class:"language-gql"},[(0,t._)("code",null,"{\n  viewer {\n    homes {\n      currentSubscription {\n        priceInfo {\n          today {\n            total\n            startsAt\n          }\n          tomorrow {\n            total\n            startsAt\n          }\n        }\n      }\n    }\n  }\n}\n")]),(0,t._)("div",{class:"line-numbers"},[(0,t._)("span",{class:"line-number"},"1"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"2"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"3"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"4"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"5"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"6"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"7"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"8"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"9"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"10"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"11"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"12"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"13"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"14"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"15"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"16"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"17"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"18"),(0,t._)("br")])],-1),w=(0,t._)("p",null,[(0,t.Uk)("Send the result from the "),(0,t._)("code",null,"tibber-query"),(0,t.Uk)(" node with the query above directly to the "),(0,t._)("code",null,"ps-receive-price"),(0,t.Uk)(" node. Make sure it is refreshed when new prices are ready. Prices for the next day are normally ready at 13:00, but refreshing every hour can be a good idea.")],-1),x=(0,t.Uk)("See example with Tibber, a switch and MQTT"),T=(0,t._)("div",{class:"custom-container danger"},[(0,t._)("p",{class:"custom-container-title"},"Warning"),(0,t._)("p",null,"The query above returns an array with all houses you have in your Tibber account. It will work only if the house you want is the first house in the array, for example if you have only one house. If that is not the case, you must use the query below.")],-1),q=(0,t._)("p",null,[(0,t._)("strong",null,"Tibber query for a specific house")],-1),I=(0,t._)("p",null,"If the above query does not give you the house you want as the first in the result array, you can use the following method. In this method you need run one query in order to find the id of the house you want the prices for first, and then use the id in the real query.",-1),P=(0,t.Uk)("Go to the "),N={href:"https://developer.tibber.com/",target:"_blank",rel:"noopener noreferrer"},S=(0,t.Uk)("Tibber Developer pages"),O=(0,t.Uk)(", sign in, and go to the "),W={href:"https://developer.tibber.com/explorer",target:"_blank",rel:"noopener noreferrer"},A=(0,t.Uk)("API Explorer"),C=(0,t.Uk)(". Load your personal token, then run the following query:"),D=(0,t._)("div",{class:"language-gql ext-gql line-numbers-mode"},[(0,t._)("pre",{class:"language-gql"},[(0,t._)("code",null,"{\n  viewer {\n    homes {\n      id\n      address {\n        address1\n        address2\n        address3\n        postalCode\n        city\n        country\n      }\n    }\n  }\n}\n")]),(0,t._)("div",{class:"line-numbers"},[(0,t._)("span",{class:"line-number"},"1"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"2"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"3"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"4"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"5"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"6"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"7"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"8"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"9"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"10"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"11"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"12"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"13"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"14"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"15"),(0,t._)("br")])],-1),H=(0,t._)("p",null,[(0,t.Uk)("Then copy the "),(0,t._)("code",null,"id"),(0,t.Uk)(" of the house you want to use prices for. It may look like this:")],-1),j=(0,t._)("div",{class:"language-text ext-text line-numbers-mode"},[(0,t._)("pre",{class:"language-text"},[(0,t._)("code",null,"NB! This is just an example:\n142c1670-ab43-2ab3-ba6d-723703a551e2\n")]),(0,t._)("div",{class:"line-numbers"},[(0,t._)("span",{class:"line-number"},"1"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"2"),(0,t._)("br")])],-1),L=(0,t._)("p",null,"Then use the id in the following query, replacing the id with the one you found in the previous query:",-1),M=(0,t._)("div",{class:"language-gql ext-gql line-numbers-mode"},[(0,t._)("pre",{class:"language-gql"},[(0,t._)("code",null,'{\n  viewer {\n    home(id: "142c1670-ab43-2ab3-ba6d-723703a551e2") {\n      currentSubscription{\n        priceInfo{\n          today {\n            total\n            startsAt\n          }\n          tomorrow {\n            total\n            startsAt\n          }\n        }\n      }\n    }\n  }\n}\n')]),(0,t._)("div",{class:"highlight-lines"},[(0,t._)("br"),(0,t._)("br"),(0,t._)("div",{class:"highlight-line"}," "),(0,t._)("br"),(0,t._)("br"),(0,t._)("br"),(0,t._)("br"),(0,t._)("br"),(0,t._)("br"),(0,t._)("br"),(0,t._)("br"),(0,t._)("br"),(0,t._)("br"),(0,t._)("br"),(0,t._)("br"),(0,t._)("br"),(0,t._)("br"),(0,t._)("br")]),(0,t._)("div",{class:"line-numbers"},[(0,t._)("span",{class:"line-number"},"1"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"2"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"3"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"4"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"5"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"6"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"7"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"8"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"9"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"10"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"11"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"12"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"13"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"14"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"15"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"16"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"17"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"18"),(0,t._)("br")])],-1),R=(0,t._)("p",null,[(0,t.Uk)("This is the query you shall put in the "),(0,t._)("code",null,"tibber-query"),(0,t.Uk)(" node.")],-1),Z=(0,t._)("h3",{id:"nord-pool-input",tabindex:"-1"},[(0,t._)("a",{class:"header-anchor",href:"#nord-pool-input","aria-hidden":"true"},"#"),(0,t.Uk)(" Nord Pool input")],-1),B=(0,t.Uk)("This is especially designed to work for Home Assistant (HA), and the "),E={href:"https://github.com/custom-components/nordpool",target:"_blank",rel:"noopener noreferrer"},G=(0,t.Uk)("Nord Pool custom component"),J=(0,t.Uk)(". The Nord Pool component provides a "),Q=(0,t._)("em",null,"sensor",-1),Y=(0,t.Uk)(" that gives price per hour for today and tomorrow (after 13:00). Send the output from this sensor directly to the "),z=(0,t._)("code",null,"ps-receive-price",-1),F=(0,t.Uk)(" node. Make sure this is done whenever the node is updated, as well as when the system starts up."),K=(0,t._)("p",null,[(0,t.Uk)("Data can be sent from both the "),(0,t._)("code",null,"current state"),(0,t.Uk)(" node or the "),(0,t._)("code",null,"events: state"),(0,t.Uk)(" node.")],-1),V=(0,t._)("div",{class:"custom-container tip"},[(0,t._)("p",{class:"custom-container-title"},"Output properties"),(0,t._)("p",null,[(0,t.Uk)("When using the "),(0,t._)("code",null,"current state"),(0,t.Uk)(" node, configure the output properties to set "),(0,t._)("code",null,"msg.payload"),(0,t.Uk)(" to "),(0,t._)("code",null,"entity"),(0,t.Uk)(".")])],-1),X=(0,t.Uk)("See example with Nord Pool and "),$=(0,t._)("code",null,"current state",-1),ee=(0,t.Uk)(" node"),ne=(0,t.Uk)("See example with Nord Pool and "),se=(0,t._)("code",null,"events: state",-1),te=(0,t.Uk)(" node"),re=(0,t._)("h3",{id:"other-input",tabindex:"-1"},[(0,t._)("a",{class:"header-anchor",href:"#other-input","aria-hidden":"true"},"#"),(0,t.Uk)(" Other input")],-1),ae=(0,t._)("p",null,"If you cannot use any of the two above (Tibber or Nord Pool), create the input to the node with the payload containing JSON like this:",-1),le=(0,t._)("div",{class:"language-json ext-json line-numbers-mode"},[(0,t._)("pre",{class:"language-json"},[(0,t._)("code",null,[(0,t._)("span",{class:"token punctuation"},"{"),(0,t.Uk)("\n  "),(0,t._)("span",{class:"token property"},'"today"'),(0,t._)("span",{class:"token operator"},":"),(0,t.Uk)(),(0,t._)("span",{class:"token punctuation"},"["),(0,t.Uk)("\n    "),(0,t._)("span",{class:"token punctuation"},"{"),(0,t.Uk)(),(0,t._)("span",{class:"token property"},'"value"'),(0,t._)("span",{class:"token operator"},":"),(0,t.Uk)(),(0,t._)("span",{class:"token number"},"1"),(0,t._)("span",{class:"token punctuation"},","),(0,t.Uk)(),(0,t._)("span",{class:"token property"},'"start"'),(0,t._)("span",{class:"token operator"},":"),(0,t.Uk)(),(0,t._)("span",{class:"token string"},'"2021-06-21T00:00:00+02:00"'),(0,t.Uk)(),(0,t._)("span",{class:"token punctuation"},"}"),(0,t._)("span",{class:"token punctuation"},","),(0,t.Uk)("\n    "),(0,t._)("span",{class:"token punctuation"},"{"),(0,t.Uk)(),(0,t._)("span",{class:"token property"},'"value"'),(0,t._)("span",{class:"token operator"},":"),(0,t.Uk)(),(0,t._)("span",{class:"token number"},"2"),(0,t._)("span",{class:"token punctuation"},","),(0,t.Uk)(),(0,t._)("span",{class:"token property"},'"start"'),(0,t._)("span",{class:"token operator"},":"),(0,t.Uk)(),(0,t._)("span",{class:"token string"},'"2021-06-21T01:00:00+02:00"'),(0,t.Uk)(),(0,t._)("span",{class:"token punctuation"},"}"),(0,t.Uk)("\n    "),(0,t._)("span",{class:"token comment"},"//..."),(0,t.Uk)("\n  "),(0,t._)("span",{class:"token punctuation"},"]"),(0,t._)("span",{class:"token punctuation"},","),(0,t.Uk)("\n  "),(0,t._)("span",{class:"token property"},'"tomorrow"'),(0,t._)("span",{class:"token operator"},":"),(0,t.Uk)(),(0,t._)("span",{class:"token punctuation"},"["),(0,t.Uk)("\n    "),(0,t._)("span",{class:"token punctuation"},"{"),(0,t.Uk)(),(0,t._)("span",{class:"token property"},'"value"'),(0,t._)("span",{class:"token operator"},":"),(0,t.Uk)(),(0,t._)("span",{class:"token number"},"3"),(0,t._)("span",{class:"token punctuation"},","),(0,t.Uk)(),(0,t._)("span",{class:"token property"},'"start"'),(0,t._)("span",{class:"token operator"},":"),(0,t.Uk)(),(0,t._)("span",{class:"token string"},'"2021-06-22T00:00:00+02:00"'),(0,t.Uk)(),(0,t._)("span",{class:"token punctuation"},"}"),(0,t._)("span",{class:"token punctuation"},","),(0,t.Uk)("\n    "),(0,t._)("span",{class:"token punctuation"},"{"),(0,t.Uk)(),(0,t._)("span",{class:"token property"},'"value"'),(0,t._)("span",{class:"token operator"},":"),(0,t.Uk)(),(0,t._)("span",{class:"token number"},"4"),(0,t._)("span",{class:"token punctuation"},","),(0,t.Uk)(),(0,t._)("span",{class:"token property"},'"start"'),(0,t._)("span",{class:"token operator"},":"),(0,t.Uk)(),(0,t._)("span",{class:"token string"},'"2021-06-22T01:00:00+02:00"'),(0,t.Uk)(),(0,t._)("span",{class:"token punctuation"},"}"),(0,t.Uk)("\n    "),(0,t._)("span",{class:"token comment"},"//..."),(0,t.Uk)("\n  "),(0,t._)("span",{class:"token punctuation"},"]"),(0,t.Uk)("\n"),(0,t._)("span",{class:"token punctuation"},"}"),(0,t.Uk)("\n")])]),(0,t._)("div",{class:"line-numbers"},[(0,t._)("span",{class:"line-number"},"1"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"2"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"3"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"4"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"5"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"6"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"7"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"8"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"9"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"10"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"11"),(0,t._)("br"),(0,t._)("span",{class:"line-number"},"12"),(0,t._)("br")])],-1),oe=(0,t._)("h2",{id:"output",tabindex:"-1"},[(0,t._)("a",{class:"header-anchor",href:"#output","aria-hidden":"true"},"#"),(0,t.Uk)(" Output")],-1),ie=(0,t.Uk)("The output is the "),ue=(0,t.Uk)("common strategy input format"),pe=(0,t.Uk)(", so it can be sent directly to the strategy nodes, or via any "),ce=(0,t._)("code",null,"ps-xxx-add-tariff",-1),_e=(0,t.Uk)(" node."),be={},de=(0,s(3744).Z)(be,[["render",function(e,n){const s=(0,t.up)("OutboundLink"),r=(0,t.up)("RouterLink");return(0,t.wg)(),(0,t.iD)(t.HY,null,[a,l,o,i,u,p,c,_,b,d,h,(0,t._)("p",null,[m,k,g,(0,t._)("a",f,[U,(0,t.Wm)(s)]),y]),v,w,(0,t._)("p",null,[(0,t.Wm)(r,{to:"/examples/example-tibber-mqtt.html"},{default:(0,t.w5)((()=>[x])),_:1})]),T,q,I,(0,t._)("p",null,[P,(0,t._)("a",N,[S,(0,t.Wm)(s)]),O,(0,t._)("a",W,[A,(0,t.Wm)(s)]),C]),D,H,j,L,M,R,Z,(0,t._)("p",null,[B,(0,t._)("a",E,[G,(0,t.Wm)(s)]),J,Q,Y,z,F]),K,V,(0,t._)("p",null,[(0,t.Wm)(r,{to:"/examples/example-nordpool-current-state.html"},{default:(0,t.w5)((()=>[X,$,ee])),_:1})]),(0,t._)("p",null,[(0,t.Wm)(r,{to:"/examples/example-nordpool-events-state.html"},{default:(0,t.w5)((()=>[ne,se,te])),_:1})]),re,ae,le,oe,(0,t._)("p",null,[ie,(0,t.Wm)(r,{to:"/nodes/strategy-input.html"},{default:(0,t.w5)((()=>[ue])),_:1}),pe,ce,_e])],64)}]])},3744:(e,n)=>{n.Z=(e,n)=>{const s=e.__vccOpts||e;for(const[e,t]of n)s[e]=t;return s}},3301:(e,n,s)=>{e.exports=s.p+"assets/img/node-ps-receive-price.76eaa418.png"}}]);