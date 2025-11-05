import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url:"http://localhost:8081/",
    realm:"OVS-System",
    clientId:"ovs_frontend"
})
export default keycloak;