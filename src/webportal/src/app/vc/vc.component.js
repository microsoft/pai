import {bool} from "prop-types";

require('bootstrap/js/modal.js');
require('datatables.net/js/jquery.dataTables.js');
require('datatables.net-bs/js/dataTables.bootstrap.js');
require('datatables.net-bs/css/dataTables.bootstrap.css');
require('datatables.net-plugins/sorting/natural.js');
require('datatables.net-plugins/sorting/title-numeric.js');
import {getSubClusters, isValidClusterParameter, parseVCNameHashParameters} from '../home/home/util';
import {restServerClient} from '../common/http-client';

const url = require('url');
//
require('./vc.component.scss');
const vcComponent = require('./vc.component.ejs');
const vcLoading  = require('./vc-loading.ejs');
const breadcrumbComponent = require('../job/breadcrumb/breadcrumb.component.ejs');
const vcModelComponent = require('./vc-modal-component.ejs');
const vcModelUser = require('./vc-modal-user.ejs');
const webportalConfig = require('../config/webportal.config.js');


let commonTable = null;
let dedicateTable = null;
let nodeListShowLength = 2;
let isAdmin = cookies.get('admin');
let specifiedSubCluster = cookies.get('subClusterUri');
let subClusters = getSubClusters();
let vcName = parseVCNameHashParameters();

const loadData = (specifiedVc) => {
  let isValidCluster = isValidClusterParameter(true);
  restServerClient.get('/api/v1/virtual-clusters/scheduler').then((response) => {
    const vcHtml = vcComponent({
      breadcrumb: breadcrumbComponent,
      vcName: vcName,
      specifiedSubCluster: specifiedSubCluster,
      subClusters: subClusters,
      data: response.data.scheduler.schedulerInfo,
      formatNumber: formatNumber,
      yarnWebPortalUri: webportalConfig.yarnWebPortalUri,
      grafanaUri: webportalConfig.grafanaUri,
      isAdmin,
      isValidCluster: isValidCluster,
      modal: vcModelComponent,
      modalUser: vcModelUser
    });
    $('#content-wrapper').html(vcHtml);
    resizeContentWrapper();
  }).catch((err) => {
    alert('Error when loading queue information data.');
    const vcHtml = vcComponent({
      breadcrumb: breadcrumbComponent,
      specifiedSubCluster: specifiedSubCluster,
      subClusters: subClusters,
      data: '',
      formatNumber: formatNumber,
      yarnWebPortalUri: webportalConfig.yarnWebPortalUri,
      isAdmin,
      isValidCluster: false,
    });
    $('#content-wrapper').html(vcHtml);
    resizeContentWrapper();
  }).finally(() => {
    setTimeout(function(){
      $("#overlay").fadeOut(300);
    },500);
  });
};

//
const formatNumber = (x, precision) => {
  const n = Math.pow(10, precision);
  return (Math.round(x * n) / n).toFixed(precision);
};

//
const resizeContentWrapper = () => {
  $('#content-wrapper').css({'height': $(window).height() -50 + 'px'});
  $('#sharedvc .dataTables_scrollBody').css('height', (($(window).height() - (isAdmin === 'true' ? 410 : 366))) + 'px');
  $('#dedicatedvc .dataTables_scrollBody').css('height', (($(window).height() - 386)) + 'px');
  if (commonTable != null) {
    commonTable.columns.adjust().draw();
  }
  if (dedicateTable != null) {
    dedicateTable.columns.adjust().draw();
  }
};

//
const nodeListShow = (nodelist, obj) => {
  const attributes = Array.prototype.slice.call($(obj))[0].attributes;
  if (attributes.isdetail === true) {
    attributes.isdetail = false;
    $(obj).html(getPartialRemarksHtml(nodelist));
  } else {
    attributes.isdetail = true;
    $(obj).html(getTotalRemarksHtml(nodelist));
  }
};

//
const getPartialRemarksHtml = (nodelist) => {
  return nodelist.split(',').splice(0, nodeListShowLength) + '&nbsp;<a href="javascript:void(0);" ><b>...</b></a>';
};

//
const getTotalRemarksHtml = (nodelist) => {
  return nodelist.split(',').join(', ');
};

//
const virtualClusterShow = () => {
  $('#virtualClustersList input[name="vcname"]').val('');
  $('#virtualClustersList input[name="capacity"]').val('');
  $('#virtualClustersList').modal('show');
};

//
const virtualClustersAdd = () => {
  let vcName = $('#virtualClustersList input[name="vcname"]').val();
  let capacity = $('#virtualClustersList input[name="capacity"]').val();
  let externalName = $('#virtualClustersList input[name="securitygroup"]').val();
  if (!vcName) {
    $('#virtualClustersList input[name="vcname"]').focus();
    return false;
  }
  if (!capacity) {
    $('#virtualClustersList input[name="capacity"]').focus();
    return false;
  }
  if (!externalName && webportalConfig.authnMethod === 'OIDC') {
    $('#virtualClustersList input[name="securitygroup"]').focus();
    return false;
  }
  restServerClient.put(`/api/v1/virtual-clusters/${vcName}`, {
    'vcCapacity': capacity,
    'externalName': externalName ? externalName : ``,
    'description': ``,
  }).then((response) => {
    loadData(url.parse(window.location.href, true).query['vcName']);
    $('#virtualClustersList').modal('hide');
    alert(response.data.message);
  }).catch((err) => {
    if (err.response) {
      alert(err.response.data.message);
      if (err.response.code === 'UnauthorizedUserError') {
        userLogout();
      }
    } else {
      alert(err.message);
    }
  });
};

//
const deleteVcItem = (name) => {
  if (name == 'default') return false;
  const res = confirm(`Notes:\r1. If there are jobs of this virtual cluster still running, it cannot be deleted.\r2. The capacity of this virtual cluster will be returned to default virtual cluster.\r\rAre you sure to delete ${name}?`);
  if (!res) return false;
  restServerClient.delete(`/api/v1/virtual-clusters/${name}`).then((response) => {
    loadData(url.parse(window.location.href, true).query['vcName']);
    alert(response.data.message);
  }).catch((err) => {
    if (err.response) {
      alert(err.response.data.message);
      if (err.response.code === 'UnauthorizedUserError') {
        userLogout();
      }
    } else {
      alert(err.message);
    }
  });
};


//
const editVcItem = (name, capacity) => {
  if (name == 'default') return false;
  $('input[name="nameEdit"]').val(name);
  $('input[name="capacityEdit"]').val(capacity);
  $('#virtualClustersEdit').modal('show');
};

//
const editVcItemPut = (name, capacity) => {
  restServerClient.put(`/api/v1/virtual-clusters/${name}`, {
    'vcCapacity': parseInt(capacity),
  }).then((response) => {
    $('#virtualClustersEdit').modal('hide');
    loadData(url.parse(window.location.href, true).query['vcName']);
    alert(responsedata.message);
  }).catch((err) => {
    if (err.response) {
      alert(err.response.data.message);
      if (err.response.code === 'UnauthorizedUserError') {
        userLogout();
      }
    } else {
      alert(err.message);
    }
  });
};

//
const changeVcState = (name, state) => {
  if (isAdmin !== 'true') return false;
  if (name === 'default') return false;
  restServerClient.put(`/api/v1/virtual-clusters/${$.trim(name)}/status`, {
    'vcStatus': state.toLowerCase() == 'running' ? 'stopped' : 'running',
  }).then((response) => {
    loadData(url.parse(window.location.href, true).query['vcName']);
    alert(response.data.message);
  }).catch((err) => {
    if (err.response) {
      alert(err.response.data.message);
      if (err.response.code === 'UnauthorizedUserError') {
        userLogout();
      }
    } else {
      alert(err.message);
    }
  });
};

const convertState = (name, state) => {
  let vcState = '';
  let vcStateChage = '';
  let vcStateOrdinary = '';
  let vcStateTips = '';
  if (state === 'RUNNING') {
    vcState = 'Running';
    vcStateChage = `onclick='changeVcState("${name}", "${state}")'`;
  } else if (state === 'STOPPED') {
    vcState = 'Stopped';
    vcStateChage = `onclick='changeVcState("${name}", "${state}")'`;
  } else if (state === 'DRAINING') {
    vcState = 'Stopping';
    vcStateChage = '';
  } else {
    vcState = 'Unknown';
    vcStateChage = '';
  }
  if (isAdmin === 'true' && name !== 'default') {
    vcStateTips = 'title="Click To Change Status"';
  } else {
    vcStateOrdinary = 'state-vc-ordinary';
  }
  return `<a ${vcStateChage} class="state-vc state-${vcState.toLowerCase()} ${vcStateOrdinary}" ${vcStateTips}>${vcState}</a>`;
};


window.virtualClusterShow = virtualClusterShow;
window.deleteVcItem = deleteVcItem;
window.editVcItem = editVcItem;
window.changeVcState = changeVcState;
window.convertState = convertState;
window.nodeListShow = nodeListShow;

$(document).ready(() => {
  $('#sidebar-menu--vc').addClass('active');
  window.onresize = function(envent) {
    resizeContentWrapper();
  };
  $(document).on('click', '.nav li', () => {
    resizeContentWrapper();
   });
  
  resizeContentWrapper();
   let vcLoadingHtml = vcLoading;
  $('#content-wrapper').html(vcLoadingHtml);

  loadData(url.parse(window.location.href, true).query['vcName']);

  // add VC
  $(document).on('click', '#virtualClustersListAdd', () => {
    virtualClustersAdd();
  });
  $(document).on('click', '#virtualClustersListEdit', () => {
    let name = $('input[name="nameEdit"]').val();
    let capacity = $('input[name="capacityEdit"]').val();
    editVcItemPut(name, capacity);
  });
});
