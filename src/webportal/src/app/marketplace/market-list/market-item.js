import uuid4 from 'uuid/v4';

export class MarketItem {
  constructor(
    name = null,
    author = null,
    tags = [],
    category = [],
    introduction = null,
    description = null,
    jobConfig = null,
    submitable = false,
  ) {
    this.Id = uuid4();
    this.name = name;
    this.author = author;
    this.createTime = new Date();
    this.updateTime = this.createTime;
    this.tags = tags;
    this.category = category;
    this.introduction = introduction;
    this.description = description;
    this.jobConfig = jobConfig;
    this.submitable = submitable;
    this.attachments = [];
    this.submits = 0;
    this.stars = 0;
  }
}
