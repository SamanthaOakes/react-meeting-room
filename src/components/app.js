// Forked from ...
// Changes:
//  * now uses outh so calendar does not need to be public
//  * minor date formatting changes

import React, { Component } from "react";
import moment from "moment";
import welcomeImage from "../images/welcome.svg";
import spinner from "../images/spinner.svg";
import { CLIENT_ID, CALENDAR_ID } from "../config.js";
import gapi from 'gapi-client';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: moment().format("h:mm A, dddd, MMMM Do, YYYY"),
      events: [],
      isBusy: false,
      isEmpty: false,
      isLoading: true
    };
  }

  componentDidMount = () => {
    this.getEvents();
    setInterval(() => {
      this.tick();
    }, 1000);
    setInterval(() => {
      this.getEvents();
    }, 60000);
  };

  getEvents() {
    let that = this;
    function start() {
      gapi.auth2
        .init({
          clientId: CLIENT_ID,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
          scope: "https://www.googleapis.com/auth/calendar.readonly"
        })
        .then(
          function() {
            if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
              gapi.auth2.getAuthInstance().signIn();
            }
            return gapi.client.request({
              path: `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?maxResults=11&singleEvents=true&orderBy=startTime&timeMin=${moment().toISOString()}&timeMax=${moment()
                .endOf("day")
                .toISOString()}`
            })
          })
        .then(
          response => {
            let events = response.result.items;
            let sortedEvents = events.sort(function(a, b) {
              return (
                moment(b.start.dateTime).format("YYYYMMDD") -
                moment(a.start.dateTime).format("YYYYMMDD")
              );
            });
            if (events.length > 0) {
              that.setState(
                {
                  events: sortedEvents,
                  isLoading: false,
                  isEmpty: false
                },
                () => {
                  that.setStatus();
                }
              );
            } else {
              that.setState({
                isBusy: false,
                isEmpty: true,
                isLoading: false
              });
            }
          },
          function(reason) {
            console.log(reason);
          }
        );
    }
    gapi.load("client", start);
  }

  tick = () => {
    let time = moment().format("h:mm A, dddd, MMMM Do, YYYY");
    this.setState({
      time: time
    });
  };

  setStatus = () => {
    let now = moment();
    let events = this.state.events;
    for (var e = 0; e < events.length; e++) {
      var eventItem = events[e];
      if (
        moment(now).isBetween(
          moment(eventItem.start.dateTime),
          moment(eventItem.end.dateTime)
        )
      ) {
        this.setState({
          isBusy: true
        });
        return false;
      } else {
        this.setState({
          isBusy: false
        });
      }
    }
  };

  render() {
    const { time, events } = this.state;

    let eventsList = events.map(function(event) {
      return (
        <a
          className="list-group-item"
          href={event.htmlLink}
          target="_blank"
          key={event.id}
        >
          {event.summary}{" "}
          <span className="badge">
            {moment(event.start.dateTime).format("h:mm a")}-
            {moment(event.end.dateTime).format("h:mm a")}
            {" "}
            , {moment(event.start.dateTime).format("MMMM Do")}{" "}
          </span>
        </a>
      );
    });

    let emptyState = (
      <div className="empty">
        <img src={welcomeImage} alt="Welcome" />
        <h3>
          No meetings are scheduled for the day. Create one by clicking the
          button below.
        </h3>
      </div>
    );

    let loadingState = (
      <div className="loading">
        <img src={spinner} alt="Loading..." />
      </div>
    );

    return (
      <div className="container">
        <div
          className={
            this.state.isBusy ? "current-status busy" : "current-status open"
          }
        >
          <h1>{this.state.isBusy ? "BUSY" : "OPEN"}</h1>
        </div>
        <div className="upcoming-meetings">
          <div className="current-time">{time}</div>
          <h1>Upcoming Meetings</h1>
          <div className="list-group">
            {this.state.isLoading && loadingState}
            {events.length > 0 && eventsList}
            {this.state.isEmpty && emptyState}
          </div>
          <a
            className="primary-cta"
            href="https://calendar.google.com/calendar?cid=c3FtMnVkaTFhZGY2ZHM3Z2o5aDgxdHVldDhAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ"
            target="_blank"
          >
            +
          </a>
        </div>
      </div>
    );
  }
}
