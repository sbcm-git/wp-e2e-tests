/** @format */

import config from 'config';

import LoginFlow from '../lib/flows/login-flow.js';

import EditorPage from '../lib/pages/editor-page.js';
import PostEditorSidebarComponent from '../lib/components/post-editor-sidebar-component.js';

import * as driverManager from '../lib/driver-manager.js';
import * as mediaHelper from '../lib/media-helper.js';
import * as dataHelper from '../lib/data-helper';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();
const host = dataHelper.getJetpackHost();

let driver;

beforeAll( async function() {
	jest.setTimeout( startBrowserTimeoutMS );
	driver = await driverManager.startBrowser();
} );

describe( `[${ host }] Editor: Media Upload (${ screenSize }) @parallel @jetpack`, () => {
	jest.setTimeout( mochaTimeOut );

	describe( 'Image Upload:', () => {
		let editorPage;

		beforeAll( async function () {
			const loginFlow = new LoginFlow( driver );
			await loginFlow.loginAndStartNewPage();
			editorPage = await EditorPage.Expect( driver );
			await editorPage.displayed();
		} );

		describe( 'Can upload many media types', () => {
			describe( 'Can upload a normal image', () => {
				let fileDetails;

				it(
					'Navigate to Editor page and create image file for upload',
					async () => {
						fileDetails = await mediaHelper.createFileWithFilename( 'normal.jpg' );
					}
				);

				it( 'Can upload an image', async () => {
					await editorPage.uploadMedia( fileDetails );
				} );

				it( 'Can delete image', async () => {
					await editorPage.deleteMedia();
				} );

				it( 'Clean up', async () => {
					await editorPage.dismissMediaModal();
					if ( fileDetails ) {
						await mediaHelper.deleteFile( fileDetails );
					}
				} );
			} );

			describe( 'Can upload an image with reserved url chars in the filename', () => {
				let fileDetails;

				it( 'Create image file for upload', async () => {
					fileDetails = await mediaHelper.createFileWithFilename(
						'filewith#?#?reservedurlchars.jpg',
						true
					);
				} );

				it( 'Can upload an image', async () => {
					await editorPage.uploadMedia( fileDetails );
				} );

				it( 'Can delete image', async () => {
					await editorPage.deleteMedia();
				} );

				it( 'Clean up', async () => {
					await editorPage.dismissMediaModal();
					if ( fileDetails ) {
						await mediaHelper.deleteFile( fileDetails );
					}
				} );
			} );

			describe( 'Can upload an mp3', () => {
				let fileDetails;

				it( 'Create mp3 for upload', async () => {
					fileDetails = await mediaHelper.getMP3FileWithFilename( 'new.mp3' );
				} );

				it( 'Can upload an mp3', async () => {
					await editorPage.uploadMedia( fileDetails );
				} );

				it( 'Can delete mp3', async () => {
					await editorPage.deleteMedia();
				} );

				it( 'Clean up', async () => {
					await editorPage.dismissMediaModal();
					if ( fileDetails ) {
						await mediaHelper.deleteFile( fileDetails );
					}
				} );
			} );

			describe( 'Can upload Featured image', () => {
				let fileDetails;
				let editorSidebar;

				it( 'Create image file for upload', async () => {
					fileDetails = await mediaHelper.createFile();
				} );

				it( 'Can open Featured Image upload modal', async () => {
					editorSidebar = await PostEditorSidebarComponent.Expect( driver );
					await editorSidebar.displayed();
					await editorSidebar.expandFeaturedImage();
					await editorSidebar.openFeaturedImageDialog();
				} );

				it( 'Can set Featured Image', async () => {
					await editorPage.sendFile( fileDetails.file );
					await editorPage.saveImage( fileDetails.imageName );
					// Will wait until image is actually shows up on editor page
					await editorPage.waitUntilFeaturedImageInserted();
				} );

				it( 'Can remove Featured Image', async () => {
					await editorSidebar.removeFeaturedImage();
					await editorSidebar.closeFeaturedImage();
				} );

				it( 'Can delete uploaded image', async () => {
					await editorSidebar.expandFeaturedImage();
					await editorSidebar.openFeaturedImageDialog();
					await editorPage.selectFirstImage();
					await editorPage.deleteMedia();
				} );

				it( 'Clean up', async () => {
					await editorPage.dismissMediaModal();
					if ( fileDetails ) {
						await mediaHelper.deleteFile( fileDetails );
					}
					await editorSidebar.closeFeaturedImage();
				} );
			} );
		} );
	} );
} );
