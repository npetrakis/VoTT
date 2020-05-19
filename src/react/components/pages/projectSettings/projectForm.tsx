import React from "react";
import CSVReader, { CSVReaderProps, IFileInfo } from "react-csv-reader";
import Form, { FormValidation, ISubmitEvent, IChangeEvent, Widget } from "react-jsonschema-form";
import { TagEditorModal, TagsInput } from "vott-react";
import { addLocValues, strings } from "../../../../common/strings";
import { IConnection, IProject, ITag, IAppSettings, IUIProject } from "../../../../models/applicationState";
import { ConnectionPickerWithRouter } from "../../common/connectionPicker/connectionPicker";
import { CustomField } from "../../common/customField/customField";
import CustomFieldTemplate from "../../common/customField/customFieldTemplate";
import "vott-react/dist/css/tagsInput.css";
import { IConnectionProviderPickerProps } from "../../common/connectionProviderPicker/connectionProviderPicker";
import { tagColors } from "./tagColors";
// tslint:disable-next-line:no-var-requires
const formSchema = addLocValues(require("./projectForm.json"));
// tslint:disable-next-line:no-var-requires
const uiSchema = addLocValues(require("./projectForm.ui.json"));

/**
 * Required properties for Project Settings form
 * @member project - Current project to fill form
 * @member connections - Array of connections to use in project
 * @member onSubmit - Function to call on form submission
 * @member onCancel - Function to call on form cancellation
 */
export interface IProjectFormProps extends React.Props<ProjectForm> {
    project: IProject;
    connections: IConnection[];
    appSettings: IAppSettings;
    onSubmit: (project: IProject) => void;
    onChange?: (project: IProject) => void;
    onCancel?: () => void;
}

/**
 * Project Form State
 * @member classNames - Class names for HTML form element
 * @member formData - data containing details of project
 * @member formSchema - json schema of form
 * @member uiSchema - json UI schema of form
 */
export interface IProjectFormState {
    classNames: string[];
    formData: IUIProject;
    formSchema: any;
    uiSchema: any;
}

/**
 * @name - Project Form
 * @description - Form for editing or creating VoTT projects
 */
export default class ProjectForm extends React.Component<IProjectFormProps, IProjectFormState> {
    private tagsInput: React.RefObject<TagsInput>;
    private tagEditorModal: React.RefObject<TagEditorModal>;
    private currentColorIndex: number = 0;
    private project: IProject = {
        videoSettings: {
            frameExtractionRate: 15,
        },
    } as IProject;
    private papaparseOptions = {
        header: false,
        skipEmptyLines: true,
      };

    constructor(props, context) {
        super(props, context);
        let formData = null;
        if (props.project) {
            this.project = props.project;
            formData = {
                connection: this.props.project.sourceConnection,
                tags: this.props.project.tags,
            };
        }
        this.project.securityToken = this.props.appSettings.securityTokens[0].name;
        this.state = {
            classNames: ["needs-validation"],
            uiSchema: { ...uiSchema },
            formSchema: { ...formSchema },
            formData,
        };
        this.tagsInput = React.createRef<TagsInput>();
        this.tagEditorModal = React.createRef<TagEditorModal>();
        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onFormCancel = this.onFormCancel.bind(this);
        this.onFormValidate = this.onFormValidate.bind(this);
        this.onTagShiftClick = this.onTagShiftClick.bind(this);
        this.onTagModalOk = this.onTagModalOk.bind(this);
    }
    /**
     * Updates state if project from properties has changed
     * @param prevProps - previously set properties
     */
    public componentDidUpdate(prevProps: IProjectFormProps) {
        if (prevProps.project !== this.props.project) {
            this.setState({
                formData: {
                    connection: this.props.project.sourceConnection,
                    tags: this.props.project.tags,
                 },
            });
        }
    }

    public render() {
        return (
            <Form
                className={this.state.classNames.join(" ")}
                showErrorList={false}
                liveValidate={true}
                noHtml5Validate={true}
                FieldTemplate={CustomFieldTemplate}
                validate={this.onFormValidate}
                fields={this.fields()}
                schema={this.state.formSchema}
                uiSchema={this.state.uiSchema}
                formData={this.state.formData}
                onChange={this.onFormChange}
                onSubmit={this.onFormSubmit}>
                <div>
                    <button className="btn btn-success mr-1" type="submit">{strings.projectSettings.save}</button>
                    <button className="btn btn-secondary btn-cancel"
                        type="button"
                        onClick={this.onFormCancel}>{strings.common.cancel}</button>
                </div>
                <TagEditorModal
                    ref={this.tagEditorModal}
                    onOk={this.onTagModalOk}

                    tagNameText={strings.tags.modal.name}
                    tagColorText={strings.tags.modal.color}
                    saveText={strings.common.save}
                    cancelText={strings.common.cancel}
                />
            </Form>
        );
    }

    private fields() {
        return {
            connection: CustomField<IConnectionProviderPickerProps>(ConnectionPickerWithRouter, (props) => {
                return {
                    id: props.idSchema.$id,
                    value: props.formData,
                    connections: this.props.connections,
                    onChange: props.onChange,
                };
            }),
            tags: CustomField<CSVReaderProps>(CSVReader, (props) => {
                return {
                    onFileLoaded: (data: any[], fileInfo: IFileInfo) => {
                        const tags = [];
                        const tagNames = [];
                        data.forEach((element) => {
                            const name = element.join(" ");
                            if (tagNames.indexOf(name) === -1) {
                                tags.push({
                                    name,
                                    color: this.fetchNextColor(),
                                });
                                tagNames.push(name);
                            }

                        });
                        props.onChange(tags);
                    },
                    parserOptions: this.papaparseOptions,
                    label: this.getTagLabel(props),
                    id: props.idSchema.$id,
                    value: props.formData,
                };

            }),
        };
    }

    private getTagLabel(props) {
        if (props.formData === undefined) {
            return strings.projectSettings.tagUpload.noTagsImportedYet;
        } else {
            return strings.projectSettings.tagUpload.tagsAlreadyImported;
        }
    }
    private fetchNextColor(): string {
        const keys = Object.keys(tagColors);
        const chosenColor = tagColors[keys[this.currentColorIndex]];
        this.currentColorIndex = (this.currentColorIndex + 1) % keys.length;
        return chosenColor;
    }

    private onTagShiftClick(tag: ITag) {
        this.tagEditorModal.current.open(tag);
    }

    private onTagModalOk(oldTag: ITag, newTag: ITag) {
        this.tagsInput.current.updateTag(oldTag, newTag);
        this.tagEditorModal.current.close();
    }

    private onFormValidate(project: IUIProject, errors: FormValidation) {
        if (Object.keys(project.connection).length === 0) {
            errors.connection.addError("is a required property");
        }

        if (this.state.classNames.indexOf("was-validated") === -1) {
            this.setState({
                classNames: [...this.state.classNames, "was-validated"],
            });
        }

        return errors;
    }

    private onFormChange = (changeEvent: IChangeEvent<IUIProject>) => {
        if (this.props.onChange) {
            const uiProject: IUIProject = {
                ...changeEvent.formData,
            };
            this.setProject(uiProject);
            this.props.onChange(this.project);
        }
    }

    private onFormSubmit(args: ISubmitEvent<IUIProject>) {
        const uiProject: IUIProject = {
            ...args.formData,
        };
        this.setProject(uiProject);
        this.props.onSubmit(this.project);
    }

    private setProject(uiProject: IUIProject) {
        this.project.name = uiProject.connection.name;
        this.project.sourceConnection = uiProject.connection;
        this.project.targetConnection = uiProject.connection;
        this.project.tags = uiProject.tags;
    }

    private onFormCancel() {
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    }
}
