import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import MockFactory from "../../../../common/mockFactory";
import registerProviders from "../../../../registerProviders";
import ProjectForm, { IProjectFormProps, IProjectFormState } from "./projectForm";
import { IProjectVideoSettings } from "../../../../models/applicationState";
import { ConnectionPickerWithRouter } from "../../common/connectionPicker/connectionPicker";

describe("Project Form Component", () => {
    const project = MockFactory.createTestProject("TestProject");
    const appSettings = MockFactory.appSettings();
    const connections = MockFactory.createTestConnections();
    let wrapper: ReactWrapper<IProjectFormProps, IProjectFormState> = null;
    const onSubmitHandler = jest.fn();
    const onChangeHandler = jest.fn();
    const onCancelHandler = jest.fn();

    function createComponent(props: IProjectFormProps) {
        return mount(
            <Router>
                <ProjectForm
                    {...props} />
            </Router>,
        ).find(ProjectForm).childAt(0);
    }

    beforeAll(() => {
        registerProviders();
    });

    describe("Completed project", () => {
        beforeEach(() => {
            onChangeHandler.mockClear();
            onSubmitHandler.mockClear();
            onCancelHandler.mockClear();

            wrapper = createComponent({
                project,
                connections,
                appSettings,
                onSubmit: onSubmitHandler,
                onChange: onChangeHandler,
                onCancel: onCancelHandler,
            });
        });

        it("renders the form correctly", () => {
            expect(wrapper.find(ConnectionPickerWithRouter)).toHaveLength(1);
        });

        it("starting project has initial state loaded correctly", () => {
            const formData = wrapper.state().formData;
            expect(formData.connection).toEqual(project.sourceConnection);
            expect(formData.connection).toEqual(project.targetConnection);
            expect(project.tags.length).toBeGreaterThan(0);
            expect(formData.tags).toEqual(project.tags);
        });

        it("starting project has correct initial rendering", () => {
            expect(project.tags.length).toBeGreaterThan(0);
        });

        it("starting project should call onSubmitHandler on submission", () => {
            const form = wrapper.find("form");
            form.simulate("submit");
            expect(onSubmitHandler).toBeCalledWith({
                ...project,
            });
        });

        it("Canceling the form calls the specified onChange handler", () => {
            const cancelButton = wrapper.find("form .btn-cancel");
            cancelButton.simulate("click");
            expect(onCancelHandler).toBeCalled();
        });
    });

    describe("Empty Project", () => {
        beforeEach(() => {
            wrapper = createComponent({
                project: null,
                appSettings,
                connections,
                onSubmit: onSubmitHandler,
                onChange: onChangeHandler,
                onCancel: onCancelHandler,
            });
        });
        it("Has initial state loaded correctly", () => {
            const formData = wrapper.state().formData;
            expect(formData.connection).toEqual({});
            expect(formData.tags).toBe(undefined);
        });

        it("Has correct initial rendering", () => {
            expect(wrapper.find(".tag-wrapper")).toHaveLength(0);
        });

        it("Should not call onChangeHandler on submission because of empty required values", () => {
            const form = wrapper.find("form");
            form.simulate("submit");
            expect(onSubmitHandler).not.toBeCalled();
        });
        // No input present anymore
        // it("create a new tag when no tags exist", () => {
        //     wrapper = createComponent({
        //         project: null,
        //         appSettings,
        //         connections,
        //         onSubmit: onSubmitHandler,
        //         onChange: onChangeHandler,
        //         onCancel: onCancelHandler,
        //     });
        //     const newTagName = "My new tag";
        //     wrapper.find("input").last().simulate("change", { target: { value: newTagName } });
        //     wrapper.find("input").last().simulate("keyDown", { keyCode: 13 });

        //     const tags = wrapper.state().formData.tags;
        //     expect(tags).toHaveLength(1);
        //     expect(tags[0].name).toEqual(newTagName);
        // });
    });
});
