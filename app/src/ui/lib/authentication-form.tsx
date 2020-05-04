import * as React from 'react'
import { LinkButton } from '../lib/link-button'
import { Octicon, OcticonSymbol } from '../octicons'
import { Loading } from './loading'
import { Form } from './form'
import { Button } from './button'
import { TextBox } from './text-box'
import { Errors } from './errors'
import { getDotComAPIEndpoint } from '../../lib/api'

interface IAuthenticationFormProps {
  /**
   * The URL to the host which we're currently authenticating
   * against. This will be either https://api.github.com when
   * signing in against GitHub.com or a user-specified
   * URL when signing in against a GitHub Enterprise Server
   * instance.
   */
  readonly endpoint: string

  /** Does the server support basic auth? */
  readonly supportsBasicAuth: boolean

  /**
   * A callback which is invoked once the user has entered a username
   * and password and submitted those either by clicking on the submit
   * button or by submitting the form through other means (ie hitting Enter).
   */
  readonly onSubmit: (username: string, password: string) => void

  /**
   * A callback which is invoked if the user requests OAuth sign in using
   * their system configured browser.
   */
  readonly onBrowserSignInRequested: () => void

  /** An array of additional buttons to render after the "Sign In" button. */
  readonly additionalButtons?: ReadonlyArray<JSX.Element>

  /**
   * An error which, if present, is presented to the
   * user in close proximity to the actions or input fields
   * related to the current step.
   */
  readonly error: Error | null

  /**
   * A value indicating whether or not the sign in store is
   * busy processing a request. While this value is true all
   * form inputs and actions save for a cancel action will
   * be disabled.
   */
  readonly loading: boolean

  readonly forgotPasswordUrl: string
}

interface IAuthenticationFormState {
  readonly username: string
  readonly password: string
}

/** The GitHub authentication component. */
export class AuthenticationForm extends React.Component<
  IAuthenticationFormProps,
  IAuthenticationFormState
> {
  public constructor(props: IAuthenticationFormProps) {
    super(props)

    this.state = { username: '', password: '' }
  }

  public render() {
    const content = this.props.supportsBasicAuth ? (
      this.renderEndpointRequiresWebFlow()
    ) : this.props.endpoint === getDotComAPIEndpoint() ? (
      this.renderUsernamePassword()
    ) : (
      <>
        {this.props.endpoint !== getDotComAPIEndpoint() &&
          this.renderSignInWithBrowser()}
        {this.renderUsernamePassword()}
      </>
    )

    return (
      <Form className="sign-in-form" onSubmit={this.signIn}>
        {content}
      </Form>
    )
  }

  private renderUsernamePassword() {
    const disabled = this.props.loading
    return (
      <>
        <TextBox
          label="Username or email address"
          disabled={disabled}
          autoFocus={true}
          onValueChanged={this.onUsernameChange}
        />

        <TextBox
          label="Password"
          type="password"
          disabled={disabled}
          onValueChanged={this.onPasswordChange}
        />

        {this.renderError()}

        <div className="sign-in-footer">{this.renderActions()}</div>
      </>
    )
  }

  private renderActions() {
    const signInDisabled = Boolean(
      !this.state.username.length ||
        !this.state.password.length ||
        this.props.loading
    )
    return (
      <div className="actions">
        {this.props.supportsBasicAuth ? (
          <Button type="submit" disabled={signInDisabled}>
            {this.props.loading ? <Loading /> : null} Sign in
          </Button>
        ) : null}

        {this.props.additionalButtons}

        {this.props.supportsBasicAuth ? (
          <LinkButton
            className="forgot-password-link"
            uri={this.props.forgotPasswordUrl}
          >
            Forgot password?
          </LinkButton>
        ) : null}
      </div>
    )
  }

  private renderSignInWithBrowser() {
    return (
      <>
        {this.renderSignInWithBrowserButton()}

        {this.props.additionalButtons}
      </>
    )
  }

  private renderEndpointRequiresWebFlow() {
    return (
      <>
        {getWebSignInRequiredMessage(this.props.endpoint)}

        {this.renderSignInWithBrowserButton()}
      </>
    )
  }

  private renderSignInWithBrowserButton() {
    return (
      <Button
        type="submit"
        className="button-with-icon"
        onClick={this.signInWithBrowser}
      >
        Sign in using your browser
        <Octicon symbol={OcticonSymbol.linkExternal} />
      </Button>
    )
  }

  private renderError() {
    const error = this.props.error
    if (!error) {
      return null
    }

    return <Errors>{error.message}</Errors>
  }

  private onUsernameChange = (username: string) => {
    this.setState({ username })
  }

  private onPasswordChange = (password: string) => {
    this.setState({ password })
  }

  private signInWithBrowser = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault()
    }
    this.props.onBrowserSignInRequested()
  }

  private signIn = () => {
    this.props.onSubmit(this.state.username, this.state.password)
  }
}

function getWebSignInRequiredMessage(endpoint: string): JSX.Element {
  if (endpoint === getDotComAPIEndpoint()) {
    return (
      <>
        <p>
          To improve the security of your account, GitHub now requires you to
          sign in through your browser.
        </p>
        <p>
          Your browser will redirect you back to GitHub Desktop once you've
          signed in. If your browser asks for your permission to launch GitHub
          Desktop please allow it to.
        </p>
      </>
    )
  } else {
    return (
      <p>
        Your GitHub Enterprise Server instance requires you to sign in with your
        browser.
      </p>
    )
  }
}
