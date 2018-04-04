import { Component, OnInit, Inject } from '@angular/core';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import 'rxjs/add/operator/switchMap';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';

import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import { Comment } from '../shared/comment';
import { visibility, flyInOut, expand } from '../animations/app.animation';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  host: {
    '[@flyInOut]': 'true',
    'style': 'display: block;'
  },
  animations: [
    flyInOut(),
    visibility(),
    expand()
  ]
})
export class DishdetailComponent implements OnInit {

  dish: Dish;
  dishcopy = null;
  dishIds: number[];
  prev: number;
  next: number;
  errMess: string;
  visibility = 'shown';

  //Comment submission form
  commentForm: FormGroup;
  comment: Comment;
  commentFormErrors = {
    'author': '',
    'rating': '',
    'comment': ''
  };

  validationMessages = {
    'author': {
      'required': 'Author Name is required.',
      'minlength': 'Author Name must be at least 2 characters long'
    },
    'rating': {
      'required': 'Rating is required'
    },
    'comment': {
      'required': 'Comment is required.',
      'minlength': 'Comment must be at least 1 characters long'
    }
  };

  constructor(private dishservice: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private commentformbuilder: FormBuilder,
    @Inject('BaseURL') private BaseURL) { }

  ngOnInit() {
    this.dishservice.getDishIds().subscribe(dishIds => this.dishIds = dishIds,
      errmess => this.errMess = <any>errmess);
    this.route.params
      .switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishservice.getDish(+params['id']); })
      .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
      errmess => { this.dish = null; this.errMess = <any>errmess; });

    this.createCommentForm();
 }

  goBack(): void {
    this.location.back();
  }

  setPrevNext(dishId: number) {
    let index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  createCommentForm() {
    this.commentForm = this.commentformbuilder.group({
      author: ['', [Validators.required, Validators.minLength(2)]],
      rating: 5,
      comment: ['', [Validators.required, Validators.minLength(1)]]

    });

    this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); //for reset/set form validation msgs
  }
  onValueChanged(data?: any) {
    if (!this.commentForm) {
      return;
    }
    const form = this.commentForm;

    for (const field in this.commentFormErrors) {
      this.commentFormErrors[field] = '';//clear the previous errors if any
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.validationMessages[field];
        for (const key in control.errors) {
          this.commentFormErrors[field] += messages[key] + ' ';
        }
      }
    }
  }

  onCommentSubmit() {
    this.comment = this.commentForm.value;
    //date in ISO String format added
    this.comment.date = new Date().toISOString();
    console.log(this.comment);
    console.log(this.commentForm.status);

    this.dishcopy.comments.push(this.comment);
    this.dishcopy.save()
      .subscribe(dish => { this.dish = dish; console.log(this.dish); });

    this.commentForm.reset({
      author: '',
      rating: 5,
      comment: ''
    });
  }

}
