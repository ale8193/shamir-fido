import React, { Component } from 'react';
import protectedAreaController from '../../controllers/protectedAreaController';
import secretController from '../../controllers/secretController';

export default class Protected extends Component {
    constructor(props) {
        super(props);
        this.state = {
            userData: props.userData,
            masterSecret: null,
            fileLabel: 'Choose your secret file',
            fileError: false,
            file: null,
            fileContent: ''
        };

        this.fileInput = React.createRef();
    }

    componentDidMount() {
        const { username } = this.props.userData;
        const masterSecret = secretController.masterSecretFromLocalStorage(username);
        if (masterSecret) {
            this.setState({ masterSecret });
        } else {
            this.props.setMessage({
                type: 'danger',
                dismissable: true,
                content: (
                    <div>
                        <strong>Error on retrive master secret!</strong> Probably your credentials are wrong
                    </div>
                )
            })
        } 
    }

    handleFileChange = () => {
        const { file } = this.state;
        const inputfile = this.fileInput.current.files[0];
        if (inputfile) {
            this.setState({
                fileLabel: inputfile.name,
                file: inputfile,
                fileError: false
            });
        } else {
            if (file === null) {
                this.setState({
                    fileLabel: 'Choose your secret inputfile',
                    file: null
                });
            }
        }
    };

    handleButtonClick = type => {
        const { file, masterSecret } = this.state;
        if (file === null) {
            this.setState({
                fileError: 'You need to load file encrypt/decrypt it'
            });
        } else {
            let actionPromise;
            if (type === 'encrypt') {
                // Encrypt file
                actionPromise = protectedAreaController.encryptFile(masterSecret, file);
            } else if (type === 'decrypt') {
                // Decrypt file
                actionPromise = protectedAreaController.decryptFile(masterSecret, file);
            }
            if (actionPromise) {
                actionPromise.then(result => {
                    //console.log(result);
                    this.setState({ fileContent: result });
                })
                .catch(err => {
                    console.log(err);
                    this.props.setMessage({
                        type: 'danger',
                        dismissable: true,
                        content: (
                            <div>
                                <strong>Error!</strong> Probably your credentials are wrong
                            </div>
                        )
                    })
                });
            }
        }
    };

    render() {
        const { fileLabel, fileError, fileContent } = this.state;

        return (
            <div className="row">
                <div className="col-12">
                    <div className="form-wrapper">
                        <h3>Protected Area</h3>
                        <hr />
                        <p>In this area you can encrypt and decrypt your files.</p>
                        <div className="form-group">
                            <div className="custom-file">
                                <input
                                    type="file"
                                    className={fileError ? 'custom-file-input is-invalid' : 'custom-file-input'}
                                    id="file"
                                    ref={this.fileInput}
                                    onChange={this.handleFileChange}
                                />
                                <label className="custom-file-label" htmlFor="file">
                                    {fileLabel}
                                </label>
                                <div className="invalid-feedback">{fileError}</div>
                                <small className="text-muted form-help">Click to add file to encrypt or decrypt</small>
                            </div>
                        </div>
                        <hr />
                        <div className="row align-item-start text-center">
                            <div className="col-12 col-md-6">
                                <button className="btn btn-success d-block m-auto" onClick={() => this.handleButtonClick('encrypt')}>
                                    Encrypt file
                                </button>
                                <small className="text-muted form-help">
                                    File encryption will encrypt the content of your loaded file and will create a new file with the encrypted content. The encrypted
                                    content will be also displayed on the box below
                                </small>
                            </div>
                            <div className="col-12 col-md-6">
                                <button className="btn btn-danger d-block m-auto" onClick={() => this.handleButtonClick('decrypt')}>
                                    Decrypt
                                </button>
                                <small className="text-muted form-help">
                                    File decryption will decrypt the content of your loaded file and will display the decrypted content on the box below, without changing the encrypted file
                                </small>
                            </div>
                        </div>
                        <hr />
                        <div className="form-group">
                            <label htmlFor="fileContent">File Content</label>
                            <textarea className="form-control" id="fileContent" rows="10" value={fileContent} readOnly />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
