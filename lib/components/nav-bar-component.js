/** @format */

import { By as by } from 'selenium-webdriver';
import * as driverHelper from '../driver-helper.js';

import AsyncBaseContainer from '../async-base-container';

export default class NavBarComponent extends AsyncBaseContainer {
	constructor( driver ) {
		super( driver, by.css( '.masterbar' ) );
	}
	async clickCreateNewPost( { siteURL = null } = {} ) {
		const postButtonSelector = by.css( 'a.masterbar__item-new' );
		await driverHelper.clickWhenClickable( this.driver, postButtonSelector );
		if ( siteURL !== null ) {
			return await driverHelper.selectElementByText(
				this.driver,
				by.css( '.site__domain' ),
				siteURL
			);
		}
	}
	async clickProfileLink() {
		const profileSelector = by.css( 'a.masterbar__item-me' );
		return await driverHelper.clickWhenClickable(
			this.driver,
			profileSelector,
			this.explicitWaitMS
		);
	}
	async clickMySites() {
		const mySitesSelector = by.css( 'header.masterbar a.masterbar__item' );
		return await driverHelper.clickWhenClickable(
			this.driver,
			mySitesSelector,
			this.explicitWaitMS
		);
	}
	hasUnreadNotifications() {
		return this.driver
			.findElement( by.css( '.masterbar__item-notifications' ) )
			.getAttribute( 'class' )
			.then( classNames => {
				return classNames.includes( 'has-unread' );
			} );
	}
	async openNotifications() {
		const driver = this.driver;
		const notificationsSelector = by.css( '.masterbar__item-notifications' );
		let classNames = await driver.findElement( notificationsSelector ).getAttribute( 'class' );
		if ( classNames.includes( 'is-active' ) === false ) {
			return driverHelper.clickWhenClickable( driver, notificationsSelector );
		}
	}
	async openNotificationsShortcut() {
		return await this.driver.findElement( by.tagName( 'body' ) ).sendKeys( 'n' );
	}
	async confirmNotificationsOpen() {
		const selector = by.css( '.wpnt-open' );
		return await driverHelper.isEventuallyPresentAndDisplayed( this.driver, selector );
	}
	async dismissGuidedTours() {
		const self = this;
		const guidedToursDialogSelector = by.css( 'div.guided-tours__step-first' );
		const guidedToursDismissButtonSelector = by.css(
			'div.guided-tours__step-first button:not(.is-primary)'
		);
		let present = await driverHelper.isElementPresent( self.driver, guidedToursDialogSelector );
		if ( present === true ) {
			return await driverHelper.clickWhenClickable( self.driver, guidedToursDismissButtonSelector );
		}
	}
}
