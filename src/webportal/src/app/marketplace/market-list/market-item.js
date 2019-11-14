import uuid4 from 'uuid/v4';

export class MarketItem {
  constructor(
    id = uuid4(),
    name = null,
    author = null,
    createDate = new Date(),
    updateDate = createDate,
    category = null,
    tags = [],
    introduction = null,
    description = null,
    jobConfig = null,
    submits = 0,
    stars = 0,
  ) {
    this.id = id;
    this.name = name;
    this.author = author;
    this.createDate = new Date();
    this.updateDate = updateDate;
    this.category = category;
    this.tags = tags;
    this.introduction = introduction;
    this.description = description;
    this.jobConfig = jobConfig;
    this.submits = submits;
    this.stars = stars;
  }
}
