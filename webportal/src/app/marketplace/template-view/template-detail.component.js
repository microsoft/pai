// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


// module dependencies
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const webportalConfig = require('../../config/webportal.config.json');
const templateDetailComponent = require('./template-detail.component.ejs');
const detailOverviewComponent = require('./detail-overview.component.ejs');
const detailQaComponent = require('./detail-qa.component.ejs');
const detailReviewComponent = require('./detail-review.component.ejs');
const detailExperimentComponent = require('./detail-experiment.component.ejs');

require('./template-detail.component.scss');

const qaData = [
  {
    question: {
      name: 'Jake Shivers',
      avatar: '/assets/img/pic1.png',
      date: '2018/7/6',
      content: 'I cannot get the installer to get past Installing...". I have VS 2017 (15.7), and have rebooted my machine several times. What do I need to do to get this thing to install?',
    },
    answer: {
      name: 'Microsoft',
      avatar: '/assets/img/pic5.png',
      date: '2018/7/6',
      content: 'Thanks for reporting this issue! We need more data to investigate your problem. Please use Visual Studio\'s "Send Feedback -> Report a Problem" tool to file a ticket which will also collect the diagnostic data.',
    },
  },
  {
    question: {
      name: 'Shawn Branham',
      avatar: '/assets/img/pic2.png',
      date: '2018/7/5',
      content: 'I\'m trying to share when merging code and resolving merge conflicts but it says "The participant is not currently editing and shared document". Does anyone know Fb how to get around this so we can collaborate on the merge conflicts?',
    },
    answer: {
      name: 'Microsoft',
      avatar: '/assets/img/pic5.png',
      date: '2018/7/6',
      content: 'Hey Shawn! This message indicates that you\'re trying to follow someone, but they aren\'t currently editing a document that is part of the shared project.',
    },
  },
  {
    question: {
      name: 'Aimore Sa',
      avatar: '/assets/img/pic3.png',
      date: '2018/6/18',
      content: 'Does it work on VS for Mac? I tried to find this extension but I did not find it on my VS 2017 Mac',
    },
    answer: {
      name: 'Microsoft',
      avatar: '/assets/img/pic5.png',
      date: '2018/6/18',
      content: 'Hey! Live Share is currently only supported in Visual Studio Code and Visual Studio 2017 on Windows. We have a backlog item for adding support for Visual Studio on Mac. which you can track progress of here: https://github.com/MicrosoftDocs/live-share/issues/91.',
    },
  },
  {
    question: {
      name: 'slashelement',
      avatar: '/assets/img/pic4.png',
      date: '2018/5/17',
      content: 'I get this error 17/05/2018 19:32:44 - VSIXInstaller.NoApplicableSKUsException: This extension is not installable on any currently installed products. at VSIXInstaller.App.GetInstallableData(String vsixPath, Boolean isRepairSupported, lEnumerablel& skuData) at VSIXInstaller.Appinitialize',
    },
  },
];

const reviewData = [
  {
    name: 'Santiago Bazan',
    avatar: '/assets/img/pic.png',
    star: 5,
    date: '2018/7/23',
    description: 'Website says this was available on May 8th, this page says its still private preview.',
  },
  {
    name: 'Mahmoud Farahat',
    avatar: '/assets/img/pic1.png',
    star: 5,
    date: '2018/7/21',
    description: 'It looks like one of updates flipped the description back to saying private preview, which is not the case. We are in fact in public preview.',
  },
  {
    name: 'Honey Lin',
    avatar: '/assets/img/pic2.png',
    star: 5,
    date: '2018/7/20',
    description: 'Fluid, Fast and Awesome!',
  },
  {
    name: 'hong Le',
    avatar: '/assets/img/pic3.png',
    star: 4,
    date: '2018/7/2',
    description: 'Amazing! Good job!',
  },
  {
    name: 'Jesus Garcia',
    avatar: '/assets/img/pic4.png',
    star: 5,
    date: '2018/7/1',
    description: 'working as expected.',
  },
];

const experimentData = [
  {
    name: 'Cifar10',
    type: 'BATCH',
    duration: '10h 12m 5s',
    time: '6/28/2018 3:51:04 PM',
    status: 'RUNNING',
    number: [7, 1],
    visualization: 'https://www.tensorflow.org/images/mnist_tensorboard.png',
  },
  {
    name: 'Cifar10',
    type: 'BATCH',
    duration: '10h 12m 5s',
    time: '6/28/2018 3:51:04 PM',
    status: 'RUNNING',
    number: [7, 1],
    visualization: 'https://www.tensorflow.org/images/mnist_tensorboard.png',
  },
  {
    name: 'Cifar10',
    type: 'BATCH',
    duration: '10h 12m 5s',
    time: '6/28/2018 3:51:04 PM',
    status: 'SUCCEEDED',
    number: [7, 1],
    visualization: 'https://www.tensorflow.org/images/mnist_tensorboard.png',
  },
];

const loadSummary = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const type = searchParams.get('type');
  const name = searchParams.get('name');
  const version = searchParams.get('version');
  if (!type || !name || !version) {
    window.location.href = "/template.html"
  } else {
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/template/${type}/${name}/${version}`,
      type: 'GET',
      dataType: 'json',
      success: function(data) {
        var template = data.job ? data.job : data;
        var overviewData = {
          description: template.description,
          prerequisites: [],
          categories: ['Deep Learning', 'Snippet', 'Resource'],
          tags: ['pai', 'javascript', 'python', 'ruby', 'rust'],
        };
        if (data.prerequisites) {
          data.prerequisites.forEach(function(item) {
            overviewData.prerequisites.push({
              name: item.name,
              avatar: `/assets/img/${item.type}.png`,
              contributor: item.contributor,
              star: 3,
              downloads: 66,
            });
          });
        }
        const templateDetailHtml = templateDetailComponent({
          breadcrumb: breadcrumbComponent,
          overview: detailOverviewComponent,
          qa: detailQaComponent,
          review: detailReviewComponent,
          experiment: detailExperimentComponent,
          detail: {
            type,
            name,
            version,
            uses: data.count,
            star: Math.round(data.rating),
            contributor: template.contributor,
            overview: overviewData,
            qas: qaData,
            reviews: reviewData,
            experiments: experimentData,
          },
        });
        $('#content-wrapper').html(templateDetailHtml);
        $('#btn-use').click((event) => {
          window.location.href = "/import.html" + window.location.search;
        });
      }
    });
  }
};

// detail page start
$(document).ready(() => {
  $('#sidebar-menu--template-view').addClass('active');
  loadSummary();
});
